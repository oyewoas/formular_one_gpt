# Formula One AI Assistant

A sophisticated AI-powered assistant that provides comprehensive information about Formula One racing using advanced RAG (Retrieval-Augmented Generation) techniques. This project demonstrates modern AI application development with a focus on performance, scalability, and user experience.

## 🚀 Features

- **Real-time Formula One Information**: Access up-to-date information about races, drivers, teams, and historical data
- **Advanced RAG Implementation**: Combines vector search with large language models for accurate, context-aware responses
- **Streaming Responses**: Real-time, streaming chat interface for smooth user experience
- **Vector Search**: Efficient semantic search using Astra DB's vector capabilities
- **Modern Tech Stack**: Built with Next.js, LangChain, and OpenAI's latest models

## 🛠️ Technical Stack

### Core Technologies
- **Next.js 14**: Modern React framework with App Router
- **TypeScript**: Type-safe development
- **LangChain**: Advanced AI orchestration
- **OpenAI**: GPT-3.5-turbo and text-embedding-3-small models
- **Astra DB**: Vector database for efficient semantic search
- **Tailwind CSS**: Modern styling framework

### Key Libraries
- `@langchain/openai`: OpenAI integration with LangChain
- `@langchain/community/vectorstores/astradb`: Vector store implementation
- `ai`: Vercel's AI SDK for streaming responses
- `@datastax/astra-db-ts`: Astra DB TypeScript client

## 🏗️ Architecture

### Data Flow
1. **User Query Processing**:
   - User messages are processed through the chat interface
   - Latest message is used for context retrieval

2. **Vector Search**:
   - Queries are converted to embeddings using OpenAI's text-embedding-3-small
   - Semantic search performed on Astra DB vector store
   - Top relevant documents retrieved for context

3. **Response Generation**:
   - Context and query combined in system prompt
   - GPT-3.5-turbo generates response
   - Responses streamed to user in real-time

### Key Components
- **Vector Store Manager**: Handles document retrieval and vector operations
- **Embedding Service**: Manages text embeddings using OpenAI
- **Chat Interface**: Real-time streaming chat implementation
- **Error Handling**: Robust error management and recovery

## 🧪 Technical Highlights

### Advanced RAG Implementation
```typescript
// Efficient vector search with caching
const vectorStore = await AstraDBVectorStore.fromExistingIndex(
  embeddings,
  astraConfig
);
const results = await store.similaritySearch(query, limit);
```

### Streaming Responses
```typescript
const stream = streamText({
  model: openai("gpt-3.5-turbo"),
  system: createSystemPrompt(relevantDocs, latestMessage),
  messages,
}).toDataStreamResponse();
```

### Error Handling
```typescript
try {
  // Robust error handling with specific error types
  if (error.message.includes("Failed to connect to vector store")) {
    return NextResponse.json(
      { error: "Failed to connect to the database" },
      { status: 503 }
    );
  }
} catch (error) {
  // Comprehensive error logging
  console.error("Error in chat route:", error);
}
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Astra DB account
- OpenAI API key

### Environment Setup
```bash
# Clone the repository
git clone [repository-url]

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials
```

### Running the Project
```bash
# Development
npm run dev

# Run seed
npm run seed

# Production build
npm run build
npm start
```

## 📚 Skills Demonstrated

- **AI/ML**: Advanced RAG implementation, vector embeddings, semantic search
- **Backend Development**: API design, error handling, streaming responses
- **Database**: Vector database management, efficient querying
- **Frontend**: Modern React development, real-time interfaces
- **DevOps**: Environment management, deployment configuration
- **Problem Solving**: Complex system integration, performance optimization

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

[Ayooluwa Oyewo] - [Your GitHub](https://github.com/yourusername)

## 🙏 Acknowledgments

- OpenAI for their powerful language models
- DataStax for Astra DB
- The LangChain team for their excellent framework
- The Next.js team for their amazing framework
