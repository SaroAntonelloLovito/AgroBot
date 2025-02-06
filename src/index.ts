import { graph as retrievalGraph } from "./retrieval_graph/graph.js";
import { graph as indexGraph } from "./index_graph/graph.js";
// eslint-disable-next-line import/no-extraneous-dependencies
import { Langfuse } from 'langfuse';
import dotenv from 'dotenv';
import readline from 'readline';

// Load environment variables
dotenv.config();

const langfuse = new Langfuse({
  secretKey: process.env.LANGFUSE_SECRET_KEY ,
  publicKey: process.env.LANGFUSE_PUBLIC_KEY ,
  baseUrl: process.env.LANGFUSE_BASE_URL 
});

async function initializeSystem() {
  const trace = langfuse.trace({
    name: 'SystemInitialization',
    metadata: { action: 'Indexing documents' },
  });

  try {
    // First, index the documents
    await indexGraph.invoke({
      docs: [], // This will use the default docs from sample_docs.json
    });
    console.log("✅ Documents indexed successfully");

    trace.update({
      output: 'Documents indexed successfully',
    });
  } catch (error) {
    if (error && typeof error === 'object' && 'message' in error) {
      trace.update({
        output: error.message,
      });
      console.error("Error initializing:", error);
    } else {
      trace.update({
        output: 'An unknown error occurred',
      });
      console.error("Error initializing:", error);
    }
    process.exit(1);
  }
}

/**
 * Initiates a command-line chat interface with AgroBot, allowing users to interact
 * with an assistant specialized in agriculture-related queries. The conversation
 * continues until the user types 'exit'. Messages are tracked in memory for context,
 * and interactions are traced using Langfuse for monitoring purposes. Handles errors
 * gracefully by informing the user and maintaining session continuity.
 */
async function chat() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const memory: { role: string; content: string }[] = [];
  console.log("🌱 AgroBot initialized. Ask me anything about agriculture! (type 'exit' to quit)");

  let isRunning = true;
  while (isRunning) {
    const input = await new Promise<string>(resolve => rl.question('\nYou: ', resolve));
    
    if (input.toLowerCase() === 'exit') {
      console.log('Goodbye! 👋');
      rl.close();
      isRunning = false;
      continue;
    }

    const currentMessage = { role: "human", content: input };
    memory.push(currentMessage);

    const trace = langfuse.trace({
      name: 'ChatInteraction',
      metadata: { input: input },
    });

    try {
      const result = await retrievalGraph.invoke({ 
        messages: memory.slice(-10) // Keep last 10 messages for context
      });
      const botResponse = result.messages[result.messages.length - 1].content;
      console.log('\nAgroBot: ' + botResponse);
      memory.push({ role: "assistant", content: botResponse });

      trace.update({
        output: botResponse,
      });
    } catch (error) {
      if (error && typeof error === 'object' && 'message' in error) {
        trace.update({
          output: error.message,
        });
        console.error('Error:', error);
      } else {
        trace.update({
          output: 'An unknown error occurred',
        });
        console.error('Error:', error);
      }
      console.log('\nAgroBot: Sorry, I encountered an error. Please try again.');
    }
  }
}

// Run if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeSystem()
    .then(() => chat())
    .catch((error) => {
      if (error && typeof error === 'object' && 'message' in error) {
        console.error("Error:", error);
      } else {
        console.error("An unknown error occurred");
      }
    });
}

// Export the graphs for use in other files
export { retrievalGraph, indexGraph }; 