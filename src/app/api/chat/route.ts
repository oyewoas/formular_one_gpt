import { OpenAIEmbeddings } from "@langchain/openai";
import {
  AstraDBVectorStore,
  AstraLibArgs,
} from "@langchain/community/vectorstores/astradb";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextResponse } from "next/server";
import { Message } from "ai";

interface ChatRequest {
  messages: Message[];
}

// Constants
const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_APPLICATION_TOKEN,
  OPENAI_API_KEY,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_ENDPOINT,
} = process.env;

// Validate environment variables
if (
  !ASTRA_DB_NAMESPACE ||
  !ASTRA_DB_APPLICATION_TOKEN ||
  !OPENAI_API_KEY ||
  !ASTRA_DB_COLLECTION ||
  !ASTRA_DB_ENDPOINT
) {
  throw new Error("Missing required environment variables");
}

// Initialize LangChain components
const embeddings = new OpenAIEmbeddings({
  openAIApiKey: OPENAI_API_KEY,
  modelName: "text-embedding-3-small",
});

const astraConfig: AstraLibArgs = {
  token: ASTRA_DB_APPLICATION_TOKEN,
  endpoint: ASTRA_DB_ENDPOINT,
  collection: ASTRA_DB_COLLECTION,
  namespace: ASTRA_DB_NAMESPACE,
  collectionOptions: {
    vector: {
      dimension: 1536,
      metric: "dot_product",
    },
  },
};

// Cache the vector store instance
let vectorStore: AstraDBVectorStore | null = null;

// Utility functions
async function getVectorStore(): Promise<AstraDBVectorStore> {
  if (vectorStore) {
    return vectorStore;
  }

  try {
    // Only use existing collection, don't try to create
    vectorStore = await AstraDBVectorStore.fromExistingIndex(
      embeddings,
      astraConfig
    );
    return vectorStore;
  } catch (error) {
    console.error("Error connecting to vector store:", error);
    throw new Error("Failed to connect to vector store");
  }
}

async function getRelevantDocuments(
  query: string,
  limit: number = 10
): Promise<string[]> {
  try {
    const store = await getVectorStore();
    const results = await store.similaritySearch(query, limit);
    return results.map((doc) => doc.pageContent);
  } catch (error) {
    console.error("Error retrieving documents:", error);
    throw new Error("Failed to retrieve relevant documents");
  }
}

function createSystemPrompt(context: string, question: string): string {
  return `
    You are an AI assistant who knows everything about Formula One.
    Use the below context to augment what you know about Formula One racing.
    The context will provide you with the most recent page data from wikipedia,
    the official F1 website, latest news articles, and other sources.
    If the context doesn't include the information you need, answer based on your
    existing knowledge and don't mention the source of your information or 
    what the context does or doesn't include.
    Format responses using markdown where applicable and don't return images.
    ------------------
    START CONTEXT
    ${context}
    END CONTEXT
    ------------------
    QUESTION: ${question}
    -------------------
  `;
}

export async function POST(req: Request) {
  try {
    // Validate request
    if (!req.body) {
      return NextResponse.json(
        { error: "Request body is required" },
        { status: 400 }
      );
    }

    const { messages } = (await req.json()) as ChatRequest;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required and must not be empty" },
        { status: 400 }
      );
    }

    const latestMessage = messages[messages.length - 1]?.content;
    if (!latestMessage) {
      return NextResponse.json(
        { error: "Latest message content is required" },
        { status: 400 }
      );
    }

    // Get relevant documents
    const relevantDocs = await getRelevantDocuments(latestMessage);
    const docContext = JSON.stringify(relevantDocs);

    // Create and stream response
    const stream = streamText({
      model: openai("gpt-3.5-turbo"),
      system: createSystemPrompt(docContext, latestMessage),
      messages,
    }).toDataStreamResponse();

    return stream;
  } catch (error) {
    console.error("Error in chat route:", error);

    // Handle specific error types
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
