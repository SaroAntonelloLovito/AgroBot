import { graph as retrievalGraph } from "./retrieval_graph/graph.js";
import { graph as indexGraph } from "./index_graph/graph.js";
import dotenv from "dotenv";
import readline from 'readline';

// Load environment variables
dotenv.config();

async function initializeSystem() {
  try {
    // First, index the documents
    await indexGraph.invoke({
      docs: [], // This will use the default docs from sample_docs.json
    });
    console.log("✅ Documents indexed successfully");
  } catch (error) {
    console.error("Error initializing:", error);
    process.exit(1);
  }
}

async function chat() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const messages = [];
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

    messages.push({ role: "human", content: input });

    try {
      const result = await retrievalGraph.invoke({ messages });
      const botResponse = result.messages[result.messages.length - 1].content;
      console.log('\nAgroBot: ' + botResponse);
      messages.push({ role: "assistant", content: botResponse });
    } catch (error) {
      console.error('Error:', error);
      console.log('\nAgroBot: Sorry, I encountered an error. Please try again.');
    }
  }
}

// Run if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeSystem()
    .then(() => chat())
    .catch(console.error);
}

// Export the graphs for use in other files
export { retrievalGraph, indexGraph }; 