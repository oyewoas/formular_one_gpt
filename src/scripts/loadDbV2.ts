import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer";
import { OpenAIEmbeddings } from "@langchain/openai";
import {
  AstraDBVectorStore,
  AstraLibArgs,
} from "@langchain/community/vectorstores/astradb";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import "dotenv/config";
type SimilarityMetric = "cosine" | "dot_product" | "euclidean"; // Compute the similarity of two vectors

// Constants
const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_APPLICATION_TOKEN,
  OPENAI_API_KEY,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_ENDPOINT,
} = process.env;

const F1_DATA_URLS = [
  // Core F1 Information
  "https://en.wikipedia.org/wiki/Formula_One", // General F1 overview
  "https://www.formula1.com/en/latest/all", // Latest F1 news

  // Current Season
  "https://www.formula1.com/en/racing/2024.html", // Current season overview
  "https://www.formula1.com/en/results.html/2024/races.html", // Current season results

  // Historical Information
  "https://en.wikipedia.org/wiki/List_of_Formula_One_World_Drivers%27_Champions", // Champions history
  "https://en.wikipedia.org/wiki/List_of_female_Formula_One_drivers", // Female drivers history

  // Recent Major News
  "https://www.skysports.com/f1/news/12433/13061245/lewis-hamilton-to-join-ferrari-for-2025-formula-1-season", // Major recent news
];

// Services
class WebScraper {
  constructor() {}

  async scrape(url: string): Promise<string> {
    const loader = new PuppeteerWebBaseLoader(url, {
      launchOptions: { headless: true },
      gotoOptions: { waitUntil: "domcontentloaded" },
      evaluate: async (page, browser) => {
        const result = await page.evaluate(() => document.body.innerHTML);
        await browser.close();
        return result;
      },
    });
    const content = await loader.scrape();
    return content?.replace(/<[^>]+>/gm, "") || "";
  }
}

class TextProcessor {
  private splitter: RecursiveCharacterTextSplitter;

  constructor() {
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 512,
      chunkOverlap: 100,
    });
  }

  async splitText(text: string): Promise<string[]> {
    return this.splitter.splitText(text);
  }
}

// Utility function for retrying operations
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 5000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.log(`Attempt ${attempt} failed: ${lastError.message}`);
      if (attempt < maxRetries) {
        console.log(`Retrying in ${delayMs / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}

class VectorStoreManager {
  private vectorStore: AstraDBVectorStore | undefined;
  private astraConfig: AstraLibArgs;
  private embeddings: OpenAIEmbeddings;

  constructor(similarityMetric: SimilarityMetric = "dot_product") {
    this.astraConfig = {
      token: ASTRA_DB_APPLICATION_TOKEN as string,
      endpoint: ASTRA_DB_ENDPOINT as string,
      collection: ASTRA_DB_COLLECTION as string,
      namespace: ASTRA_DB_NAMESPACE as string,
      collectionOptions: {
        vector: {
          dimension: 1536,
          metric: similarityMetric,
        },
      },
    };
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: OPENAI_API_KEY,
      modelName: "text-embedding-3-small",
    });
  }

  async initialize(): Promise<void> {
    this.vectorStore = await AstraDBVectorStore.fromExistingIndex(
      this.embeddings,
      this.astraConfig
    );
  }

  async addDocuments(documents: string[]): Promise<void> {
    if (!this.vectorStore) {
      throw new Error("Vector store not initialized. Call initialize() first.");
    }

    const docs = documents.map(
      (text) =>
        new Document({
          pageContent: text,
          metadata: { source: "f1_data" },
        })
    );

    // Process documents in smaller batches
    const batchSize = 3; // Reduced batch size to prevent timeouts
    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = docs.slice(i, i + batchSize);
      console.log(
        `Adding batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(
          docs.length / batchSize
        )}...`
      );

      await retryOperation(
        async () => {
          await this.vectorStore!.addDocuments(batch);
        },
        3,
        10000
      ); // Increased delay between retries to 10 seconds

      console.log(`Batch ${Math.floor(i / batchSize) + 1} added successfully`);
    }
  }
}

// Main function
async function main() {
  try {
    const scraper = new WebScraper();
    const textProcessor = new TextProcessor();
    const vectorStoreManager = new VectorStoreManager();

    await vectorStoreManager.initialize();

    for (const url of F1_DATA_URLS) {
      console.log(`Processing ${url}...`);
      const content = await scraper.scrape(url);
      console.log("Content scraped successfully");
      const chunks = await textProcessor.splitText(content);
      console.log(`Split content into ${chunks.length} chunks`);

      await vectorStoreManager.addDocuments(chunks);
      console.log(`Completed processing ${url}`);
    }

    console.log("All data has been processed and stored successfully!");
  } catch (error) {
    console.error("An error occurred:", error);
    process.exit(1);
  }
}

// Run the main function
main();
