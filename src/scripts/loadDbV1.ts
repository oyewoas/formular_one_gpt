import { DataAPIClient } from "@datastax/astra-db-ts"
import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer";
import OpenAI from "openai"
import {RecursiveCharacterTextSplitter} from "@langchain/textsplitters"


import "dotenv/config"

type SimilarityMetric = "cosine" | "dot_product" | "euclidean" // Compute the similarity of two vectors

const {
    ASTRA_DB_NAMESPACE,
    ASTRA_DB_APPLICATION_TOKEN,
    OPENAI_API_KEY,
    ASTRA_DB_COLLECTION,
    ASTRA_DB_ENDPOINT
} = process.env

const openapi = new OpenAI({
    apiKey: OPENAI_API_KEY,
})

const f1Data = [
    'https://en.wikipedia.org/wiki/Formula_One',
    'https://en.wikipedia.org/wiki/2023_Formula_One_World_Championship',
    'https://en.wikipedia.org/wiki/2024_Formula_One_World_Championship',
    'https://en.wikipedia.org/wiki/2022_Formula_One_World_Championship',
    'https://en.wikipedia.org/wiki/2025_Formula_One_World_Championship',
    'https://en.wikipedia.org/wiki/List_of_Formula_One_World_Drivers%27_Champions',
    'https://www.formula1.com/en/racing/2023.html',
    'https://www.formula1.com/en/racing/2024.html',
    'https://www.formula1.com/en/racing/2022.html',
    'https://www.formula1.com/en/racing/2025.html',
    'https://www.formula1.com/en/results.html/2024/races.html',
    'https://www.formula1.com/en/results.html/2023/races.html',
    'https://www.formula1.com/en/results.html/2022/races.html',
    'https://www.formula1.com/en/results.html/2025/races.html',
    'https://www.formula1.com/en/latest/all',
    'https://www.autosport.com/f1/news/history-of-female-f1-drivers-including-grand-prix-starters-and-test-drivers/10584871/',
    'https://en.wikipedia.org/wiki/List_of_female_Formula_One_drivers',
    'https://www.formula1.com/en/latest/article/international-womens-day-trailblazing-women-f1-past-and-present.6rY8yNSHyQ15dyvqgxZDE0',
    'https://motorsporttickets.com/blog/f1-driver-salaries-how-much-formula-1-drivers-earn/',
    'https://www.forbes.com/sites/brettknight/2024/12/10/formula-1s-highest-paid-drivers-2024/',
    'https://www.planetf1.com/news/f1-2025-driver-salaries',
    'https://www.skysports.com/f1/news/12433/13061245/lewis-hamilton-to-join-ferrari-for-2025-formula-1-season'
]

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
const db = client.db(ASTRA_DB_ENDPOINT as string, {
    namespace: ASTRA_DB_NAMESPACE,
})

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 512, // Number of characters in each chunk
    chunkOverlap: 100, // Number of characters to overlap between chunks
})

const createCollection = async (similarityMetric: SimilarityMetric = "dot_product") => {
    const res =await db.createCollection(ASTRA_DB_COLLECTION as string, {
        vector: {
            dimension: 1536,
            metric: similarityMetric,

        }
    }
    )
    console.log("Collection created", res)
    return res
}

const loadSampleData = async () => {
    const collection = await db.collection(ASTRA_DB_COLLECTION as string)
    for await (const url of f1Data) {
        const content = await scrapePage(url)
        const chunks = await splitter.splitText(content)
        for await (const chunk of chunks) {
            const embedding = await openapi.embeddings.create({
                model: "text-embedding-3-small",
                input: chunk,
                encoding_format: "float"
            })

            const vector = embedding.data[0].embedding
            const res = await collection.insertOne({
                $vector: vector,
                text: chunk,
            })
            console.log("Inserted", res)
        }
    }
}

const scrapePage = async (url: string) => {
    const loader = new PuppeteerWebBaseLoader(url, {
        launchOptions: {
            headless: true,
        },
       gotoOptions: {
        waitUntil: "domcontentloaded"
       },
       evaluate: async (page, browser) => {
            const result = await page.evaluate(() => document.body.innerHTML)
            await browser.close()
            return result
       }
    })
    return (
        await  loader.scrape()
    )?.replace(/<[^>]+>/gm, '') // Remove HTML tags
}

createCollection().then(() => loadSampleData())