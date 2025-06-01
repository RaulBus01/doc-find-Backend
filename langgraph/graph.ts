import { ToolNode } from "npm:@langchain/langgraph/prebuilt";
import {
  Annotation,
  END,
  MessagesAnnotation,
  START,
  StateGraph,
} from "@langchain/langgraph";
import { AIMessage,HumanMessage } from "@langchain/core/messages";
import { isAIMessage } from "@langchain/core/messages";
import { ChatMistralAI } from "@langchain/mistralai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { TavilySearch } from "@langchain/tavily";
import { ContextUser } from "../types/ContextType.ts";
import { checkpointer } from "../database/database.ts";
import { googlePlaceTool } from "./GooglePlaces.ts";
import { ChatGroq } from "@langchain/groq";

const diagnosisModel = new ChatMistralAI({
  model: "mistral-medium-latest",
  temperature: 0.0,

});


const routerModel = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash",
  temperature: 0.0,
});
const researchModel = new ChatMistralAI({
  model: "mistral-medium-latest",
  temperature: 0.0,

});


const locationModel = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash",
  temperature: 0,
});
// Tools
const webSearchTool = new TavilySearch({
  tavilyApiKey: Deno.env.get("TAVILY_API_KEY"),
});

const tools = [googlePlaceTool, webSearchTool];
//@ts-ignore type not found
const toolNode = new ToolNode(tools);


const GraphAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  contextData: Annotation<ContextUser>({
    reducer: (_, action) => action,
    default: () => ({} as ContextUser),
  }),
  currentAgent: Annotation<string>({
    reducer: (_, action) => action,
    default: () => "router",
  }),
  taskType: Annotation<string>({
    reducer: (_, action) => action,
    default: () => "",
  }),
  requiresLocation: Annotation<boolean>({
    reducer: (_, action) => action,
    default: () => false,
  }),
});

// Agent-specific prompts
const routerPrompt = ChatPromptTemplate.fromMessages([
  ["system", `You are a router agent that determines what type of medical task needs to be handled.
  
  Analyze the user's message and determine the primary task:
  1. "diagnosis" - For symptom analysis, medical diagnosis, or health condition questions
  2. "research" - For complex medical research, drug interactions, treatment comparisons
  3. "location" - For finding nearby medical facilities, pharmacies, hospitals
  4. "general" - For general health advice or simple questions
  
  Respond with ONLY the task type as a single word.`],
  new MessagesPlaceholder("messages"),
]);

const diagnosisPrompt = ChatPromptTemplate.fromMessages([
  ["system", `You are a specialized medical diagnosis agent. Your expertise is in:
  - Analyzing symptoms and providing possible diagnoses
  - Interpreting medical conditions based on patient information
  - Providing immediate medical guidance and recommendations
  
  Patient context: {context_string}
  
  Focus on accurate diagnosis based on symptoms. If you need additional research about rare conditions or drug interactions, indicate that research is needed.`],
  new MessagesPlaceholder("messages"),
]);

const researchPrompt = ChatPromptTemplate.fromMessages([
  ["system", `You are a medical research agent specialized in:
  - In-depth medical research using web search
  - Drug interactions and contraindications  
  - Latest treatment protocols and medical studies
  - Complex medical condition analysis
  
  Patient context: {context_string}
  
  Use web search tool when you need current medical information, research studies, or drug interaction data.`],
  new MessagesPlaceholder("messages"),
]);

const locationPrompt = ChatPromptTemplate.fromMessages([
  ["system", `You are a location-based medical services agent. Your role is to:
  - Find nearby medical facilities (hospitals, clinics, urgent care)
  - Locate pharmacies and specialized medical services
  - Provide location-based medical recommendations

  Patient context: {context_string}
  
  When using the Google Places tool, format your input as JSON with:
  - query: the type of medical facility (e.g., "doctor", "hospital", "pharmacy")
  - location: coordinates as "lat,lng" optionally provided by the user when querying for nearby facilities if not provided try to find from context
  - city: the city name if available from context
  - radius: search radius in km (default 5)
  
  Example: {{"query": "doctor", "location": "46.1718,21.3129", "city": "Arad", "radius": "5"}}
  
  Always use the Google Places tool to find relevant medical facilities. If no location is provided, ask for permission to access location.`],
  new MessagesPlaceholder("messages"),
]);

// Helper function to build context
const buildSystemMessage = (contextData?: ContextUser | string) => {
  if (!contextData) return "";
  return Object.entries(contextData)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
};

// Router agent
const routerAgent = async (state: typeof GraphAnnotation.State, options?: { signal?: AbortSignal }) => {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1];
  
  if (lastMessage instanceof HumanMessage) {
    //@ts-ignore type not found
    const response = await routerPrompt.pipe(routerModel).invoke(
      { messages: [lastMessage] },
      { signal: options?.signal }
    );
    
    const taskType = response.content.toString().toLowerCase().trim();
    
    return {
      messages: [...messages],
      currentAgent: taskType,
      taskType: taskType,
      requiresLocation: taskType,
    };
  }
  
  return { messages: [...messages] };
};


// Updated Diagnosis agent with summarization
const diagnosisAgent = async (state: typeof GraphAnnotation.State, options?: { signal?: AbortSignal }) => {
  const { messages, contextData } = state;


  

  
  const llmWithTools = diagnosisModel.bindTools([webSearchTool]);
  //@ts-ignore type not found
  const response = await diagnosisPrompt.pipe(llmWithTools).invoke(
    {
      messages: messages,
      context_string: buildSystemMessage(contextData),
    },
    { signal: options?.signal }
  );
  
  return { messages: [...messages, response] };
};

// Updated Research agent with summarization
const researchAgent = async (state: typeof GraphAnnotation.State, options?: { signal?: AbortSignal }) => {
  const { messages, contextData } = state;
  

  
  const llmWithTools = researchModel.bindTools([webSearchTool]);
  //@ts-ignore type not found
  const response = await researchPrompt.pipe(llmWithTools).invoke(
    {
      messages: messages,
      context_string: buildSystemMessage(contextData),
    },
    { signal: options?.signal }
  );
  
  return { messages: [...messages, response] };
};

// Updated General agent with summarization
const generalAgent = async (state: typeof GraphAnnotation.State, options?: { signal?: AbortSignal }) => {
  const { messages, contextData } = state;
  

  
  const generalPrompt = ChatPromptTemplate.fromMessages([
    ["system", `You are a general medical assistant providing basic health information and guidance.
    Patient context: {context_string}`],
    new MessagesPlaceholder("messages"),
  ]);
  //@ts-ignore type not found
  const response = await generalPrompt.pipe(diagnosisModel).invoke(
    {
      messages: messages,
      context_string: buildSystemMessage(contextData),
    },
    { signal: options?.signal }
  );
  
  return { messages: [...messages, response] };
};

// Location agent with summarization
const locationAgent = async (state: typeof GraphAnnotation.State, options?: { signal?: AbortSignal }) => {
  const { messages, contextData } = state;
  

  
  const llmWithTools = locationModel.bindTools([googlePlaceTool]);
  //@ts-ignore type not found
  const response = await locationPrompt.pipe(llmWithTools).invoke(
    {
      messages: messages,
      context_string: buildSystemMessage(contextData),
    },
    { signal: options?.signal }
  );
  
  return { messages: [...messages, response] };
};

// Routing logic
const shouldContinue = (state: typeof GraphAnnotation.State) => {
  const { messages} = state;
  const lastMessage = messages[messages.length - 1];
  
  if (isAIMessage(lastMessage) && (lastMessage as AIMessage).tool_calls?.length) {
    return "tools";
  }
  
  return END;
};

const routeToAgent = (state: typeof GraphAnnotation.State) => {
  const { currentAgent } = state;
  
  switch (currentAgent) {
    case "diagnosis":
      return "diagnosis_agent";
    case "research":
      return "research_agent";
    case "location":
      return "location_agent";
    case "general":
    default:
      return "general_agent";
  }
};



// Updated workflow
const workflow = new StateGraph(GraphAnnotation)
  .addNode("router", routerAgent)
  .addNode("diagnosis_agent", diagnosisAgent)
  .addNode("research_agent", researchAgent)
  .addNode("location_agent", locationAgent)
  .addNode("general_agent", generalAgent)
  .addNode("tools", toolNode)
  
  .addEdge(START, "router")
  .addConditionalEdges("router", routeToAgent, [
    "diagnosis_agent",
    "research_agent", 
    "location_agent",
    "general_agent"
  ])
  
  .addConditionalEdges("diagnosis_agent", shouldContinue, ["tools", END])
  .addConditionalEdges("research_agent", shouldContinue, ["tools", END])
  .addConditionalEdges("location_agent", shouldContinue, ["tools", END])
  .addConditionalEdges("general_agent", shouldContinue, ["tools", END])
  
  // Tools always return to the router to potentially switch agents
  .addEdge("tools", "router");

export const graph = workflow.compile({
  checkpointer: checkpointer,
});