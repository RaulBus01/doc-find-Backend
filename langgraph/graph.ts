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
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { tool } from "@langchain/core/tools";
import { ContextUser } from "../types/ContextType.ts";
import { z } from "npm:zod";

import { TavilySearch } from "@langchain/tavily";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { checkpointer } from "../database/database.ts";
const llm = new ChatMistralAI({
  
  model: "mistral-small-latest",
  temperature: 0,
});

const webSearchTool = new TavilySearch({
  tavilyApiKey: Deno.env.get("TAVILY_API_KEY"),
});




const tools = [webSearchTool];


//@ts-ignore tools
const toolNode = new ToolNode(tools)


await checkpointer.setup();

const GraphAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,

  contextData: Annotation<ContextUser>({
    reducer: (_, action) => action,
    default: () => ({} as ContextUser),
  }),
 

})
const modelPrompt = ChatPromptTemplate.fromMessages([
  ["system", "{context_string}"],
  new MessagesPlaceholder("messages"), 

]);

const baseContext = `You are an AI medical assistant. Your task is to analyze the given text and provide a possible diagnosis based on the symptoms and information provided.
Consider the entities marked in the text (if any) and their relevance to potential medical conditions`;
const agentContext ="If you are unsure about the diagnosis you can search online using web search tool";


export const buildSystemMessage = (contextData?: ContextUser | string) => {
  if (!contextData) {
    return baseContext;
  }
  const contextString = Object.entries(contextData)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
  return `${baseContext} with the following context about patient: ${contextString} + ${agentContext}`;
}





const callModel = async (state: typeof GraphAnnotation.State,options?:{
  signal?: AbortSignal;
}) => {
  const { messages } = state;
  const {contextData} = state;
  const abortSignal = options?.signal;
  console.log("abortSignal",abortSignal)



  const llmWithTools = llm.bindTools(tools);

  //@ts-ignore llm type
  const llmPrompt = modelPrompt.pipe(llmWithTools);
  const response = await llmPrompt.invoke(
    {
      messages: messages,

      context_string: buildSystemMessage(contextData),
    },
    {
      signal: abortSignal,

    }
   
   

  );


  return { messages: [response] };
};



const shouldContinue = (state: typeof MessagesAnnotation.State) => {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1];

  

  const isAI = isAIMessage(lastMessage);
               
  if (!isAI || !(lastMessage as AIMessage).tool_calls?.length) {
    // LLM did not call any tools, or it's not an AI message, so we should end.
    return END;
  }
  return "tools";
};






const workflow = new StateGraph(GraphAnnotation)
.addNode("agent", (state, options) => callModel(state, options))
.addEdge(START, "agent")
.addNode("tools", toolNode)
.addEdge("tools", "agent")
.addConditionalEdges("agent", shouldContinue, ["tools", END]);

export const graph = workflow.compile({

  checkpointer: checkpointer,
  
  
});