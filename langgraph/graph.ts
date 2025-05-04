import { ToolNode } from "npm:@langchain/langgraph/prebuilt";
import {
Annotation,
  END,
  MessagesAnnotation,
  START,
  StateGraph,
} from "@langchain/langgraph";
import { AIMessage, BaseMessage } from "@langchain/core/messages";
import { isAIMessage } from "@langchain/core/messages";
import { ChatMistralAI } from "@langchain/mistralai";
import { DuckDuckGoSearch } from "@langchain/community/tools/duckduckgo_search";
import  pg  from "pg";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import { PostgresChatMessageHistory } from "@langchain/community/stores/message/postgres";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { tool } from "@langchain/core/tools";
import { ContextUser } from "../types/ContextType.ts";
import { z } from "npm:zod";
import { createPubMedTool } from "./customWrapperPubMed.ts";
import { TavilySearch } from "@langchain/tavily";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { LanguageModelLike } from "@langchain/core";
const llm = new ChatMistralAI({
  
  model: "mistral-small-latest",
  temperature: 0,
});

// const llm = new ChatGoogleGenerativeAI({
//   apiKey: Deno.env.get("GOOGLE_API_KEY"),
//   model:"gemini-1.5-flash",
//   temperature: 0.2,
//    // Or another suitable model like "gemini-pro"

// });
const webSearchTool = new TavilySearch({
  maxResults: 5,
  tavilyApiKey: Deno.env.get("TAVILY_API_KEY"),
  searchDepth:"advanced"
});


const pubMedSchema =  z.object({
  query: z.string().describe("The search query for PubMed"),
  maxResults: z.number().default(5).describe("Maximum number of results to return")
});


const pubMedTool = createPubMedTool();

const tools = [webSearchTool];

//@ts-ignore tools
const toolNode = new ToolNode(tools)

const poolConfig = {
  host: Deno.env.get("DB_HOST"),
  port: 5432,
  user: Deno.env.get("DB_USER"),
  password: Deno.env.get("DB_PASSWORD"),
  database: Deno.env.get("DB_NAME"),
  ssl: true
};

const pool = new pg.Pool(poolConfig);

const GraphAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,

  contextData: Annotation<ContextUser>({
    reducer: (_, action) => action,
    default: () => ({} as ContextUser),
  }),
  sessionId: Annotation<string>({
    reducer: (_, action) => action,
    default: () => "",
  }),

})
const modelPrompt = ChatPromptTemplate.fromMessages([
  ["system", "{context_string}"],
  // new MessagesPlaceholder("chat_history"),
  ["human", "{input}"],
]);

// const baseContext = `You are an AI medical assistant. Your task is to analyze the given text and provide a possible diagnosis based on the symptoms and information provided.
// Consider the entities marked in the text (if any) and their relevance to potential medical conditions`;
const baseContext ="Explain the following text in detail. Provide a summary of the text and include any relevant information that may be useful for understanding the content. The text may contain medical terms, so ensure to explain those terms clearly. If there are any specific entities or concepts mentioned, elaborate on their significance and context.";

const agentContext ="";


export const buildSystemMessage = (contextData?: ContextUser | string) => {
  if (!contextData) {
    return baseContext;
  }
  const contextString = Object.entries(contextData)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
  return `${baseContext} with the following context about patient: ${contextString} + ${agentContext}`;
}





const callModel = async (state: typeof GraphAnnotation.State) => {
  const { messages } = state;
  const {contextData} = state;
  const {sessionId} = state;

  const llmWithTools = llm.bindTools(tools);

  const llmPrompt = modelPrompt.pipe(llmWithTools);
  // const chainWithHistory = new RunnableWithMessageHistory({
  //   runnable: llmPrompt,
  //   inputMessagesKey: "input",
  //   historyMessagesKey: "chat_history",

  //   getMessageHistory: (sessionId: string) => {
  //     const chatHistory = new PostgresChatMessageHistory({
  //       sessionId,
  //       pool: pool,
  //       tableName: "messages_history",
        
        
  //     });
  //     return chatHistory;
  //   },
  // });

  const response = await llmPrompt.invoke(
  
    {
      
      input: messages[messages.length - 1].content,
      context_string: buildSystemMessage(contextData),
    },
    {
      configurable: {
        sessionId: sessionId.toString(),
      },
    }
  );
  return { messages: [...messages, response] };
};



const shouldContinue = (state: typeof MessagesAnnotation.State) => {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1];
  console.log("Last message:", lastMessage);
  console.log("Last message type:", lastMessage.constructor.name);
  
  if (

    !isAIMessage(lastMessage) ||
    !(lastMessage as AIMessage).tool_calls?.length
  ) {
    // LLM did not call any tools, or it's not an AI message, so we should end.

    return END;
  }

  return "tools";
};






const workflow = new StateGraph(GraphAnnotation)
  .addNode("agent", callModel)
  .addEdge(START, "agent")
  .addNode("tools", toolNode)
  .addEdge("tools", "agent")
  .addConditionalEdges(
    "agent",
    shouldContinue,
    {
      tools: "tools",
      agent: "agent",
      __end__: END, // Use __end__ to specify the default end node
    }
  )


export const graph = workflow.compile({
  // The LangGraph Studio/Cloud API will automatically add a checkpointer
  // only uncomment if running locally
});