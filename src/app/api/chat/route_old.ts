import OpenAI from "openai";
import { DataAPIClient } from "@datastax/astra-db-ts";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_APPLICATION_TOKEN,
  OPENAI_API_KEY,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_ENDPOINT,
} = process.env;

const openapi = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_ENDPOINT as string, {
  namespace: ASTRA_DB_NAMESPACE,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const latestMessage = messages[messages?.length - 1]?.content;
    let docContext = "";
    const embedding = await openapi.embeddings.create({
      model: "text-embedding-3-small",
      input: latestMessage,
      encoding_format: "float",
    });

    try {
      const collection = await db.collection(ASTRA_DB_COLLECTION as string);
      const cursor = await collection.find({}, {
        sort: {
          $vector: embedding.data[0].embedding,
        },
        limit: 10,
      });
      const documents = await cursor.toArray();
      const docsMap = documents?.map((doc) => doc.text);
      docContext = JSON.stringify(docsMap);
    } catch (error) {
      console.error("Error querying collection:", error);
      return new Response("Internal Server Error", { status: 500 });
    }

    const stream = streamText({
      model: openai("gpt-3.5-turbo"),
      system: `
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
      ${docContext}
      END CONTEXT
      ------------------
      QUESTION: ${latestMessage}
      -------------------
  `,
      messages,
    }).toDataStreamResponse();
    return stream;
  } catch (error) {
    console.error("Error in POST request:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
