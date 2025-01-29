import { Annotation, MessagesAnnotation } from "@langchain/langgraph";
import { Document } from "@langchain/core/documents";
import { reduceDocs } from "../shared/state.js";
import { BaseMessage } from "@langchain/core/messages";

/**
 * Represents the input state for the agent.
 * This is a restricted version of the State that defines a narrower interface
 * to the outside world compared to what is maintained internally.
 */
export const InputStateAnnotation = Annotation.Root({
  /**
   * Messages track the primary execution state of the agent.
   * @type {BaseMessage[]}
   * @description
   */
  messages: Annotation<BaseMessage[]>({
    default: () => [],
    reducer: (existing: BaseMessage[], newMessages: BaseMessage[]) => [
      ...existing,
      ...newMessages,
    ],
  }),
});

/**
 * Classifies user query.
 * @typedef {Object} Router
 * @property {string} logic - The logic behind the classification.
 * @property {'more-info' | 'agriculture' | 'general'} type - The type of the query.
 */

type Router = {
  logic: string;
  type: "more-info" | "agriculture" | "general";
};

/**
 * Represents the state of the retrieval graph / agent.
 */
export const AgentStateAnnotation = Annotation.Root({
  ...InputStateAnnotation.spec,

  /**
   * The router's classification of the user's query.
   * @type {Router}
   */
  router: Annotation<Router>({
    default: () => ({ type: "general", logic: "" }),
    reducer: (existing: Router, newRouter: Router) => ({
      ...existing,
      ...newRouter,
    }),
  }),

  /**
   * A list of steps in the research plan.
   * @type {string[]}
   */
  steps: Annotation<string[]>,

  /**
   * Populated by the retriever. This is a list of documents that the agent can reference.
   * @type {Document[]}
   */
  documents: Annotation<
    Document[],
    Document[] | { [key: string]: any }[] | string[] | string | "delete"
  >({
    default: () => [],
    // @ts-ignore
    reducer: reduceDocs,
  }),

  memory: Annotation<BaseMessage[]>({
    default: () => [],
    reducer: (existing: BaseMessage[], newMessages: BaseMessage[]) => {
      const windowSize = 10; // Keep last 10 messages
      const allMessages = [...existing, ...newMessages];
      return allMessages.slice(-windowSize);
    },
  }),

  // Additional attributes can be added here as needed
  // Examples might include retrieved documents, extracted entities, API connections, etc.
});
