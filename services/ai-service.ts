import "jsr:@std/dotenv/load";

import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory} from "@google/generative-ai";
import { ContextUser } from "../types/ContextType.ts";
import pg from "npm:pg";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import { PostgresChatMessageHistory } from "@langchain/community/stores/message/postgres";
import { ChatMistralAI } from "@langchain/mistralai";
import { AIModel } from "../types/types.ts";

import { Logger } from "../utils/logger.ts";
import { DuckDuckGoSearch } from "@langchain/community/tools/duckduckgo_search";
const logger = new Logger("AIService");

const searchTool = new DuckDuckGoSearch();
import { createToolCallingAgent } from "langchain/agents";
import { AgentExecutor } from "langchain/agents";
import { LanguageModelLike } from "@langchain/core";



const modelMap = (model: AIModel) => {
  let chatModel;
  switch (model) {
    case AIModel.MISTRAL_SMALL:
      chatModel = new ChatMistralAI({
        model: AIModel.MISTRAL_SMALL,
        temperature: 0.7,
        safePrompt: true,
        streaming: true,
      });
      break;
    case AIModel.MISTRAL_LARGE:
      chatModel =  new ChatMistralAI({
        model: AIModel.MISTRAL_LARGE,
        temperature: 0.7,
        safePrompt: true,
        streaming: true,
      });
      break;
    // case AIModel.GEMINI_FLASH_LITE:
    //   return new ChatGoogleGenerativeAI({
    //     apiKey: Deno.env.get("GOOGLE_API_KEY"),
    //     model: "gemini-2.0-flash-lite",
    //     temperature: 0.7,
    //     streaming: true,
    //     safetySettings: [
    //       {
    //         category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    //         threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    //       },
    //       {
    //         category:HarmCategory.HARM_CATEGORY_HARASSMENT,
    //         threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    //       }
    //     ]
    //   });
   
    default:
      logger.warn("Model not found, using default Mistral Small model.");
      chatModel = new ChatMistralAI({
        model: AIModel.MISTRAL_SMALL,
        temperature: 0.7,
        safePrompt: true,
        streaming: true,
      });
      break;
      
  }
  return chatModel;
}


const baseContext = `You are an AI medical assistant. Your task is to analyze the given text and provide a possible diagnosis based on the symptoms and information provided.
Consider the entities marked in the text (if any) and their relevance to potential medical conditions`;
const agentContext = `You can also use the search tool to find relevant information and provide a more accurate diagnosis.`;
// const baseContext = "You are an AI assistant";
const buildSystemMessage = (contextData?: ContextUser | string) => {
  if (!contextData) {
    return baseContext;
  }
  const contextString = Object.entries(contextData)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
  return `${baseContext} with the following context about patient: ${contextString} + ${agentContext}`;
}

const poolConfig = {
  host: Deno.env.get("DB_HOST"),
  port: 5432,
  user: Deno.env.get("DB_USER"),
  password: Deno.env.get("DB_PASSWORD"),
  database: Deno.env.get("DB_NAME"),
  ssl: true
};

const pool = new pg.Pool(poolConfig);

const modelPrompt = ChatPromptTemplate.fromMessages([
  ["system", "{context_string}"],
  new MessagesPlaceholder("chat_history"),
  ["human", "{input}"],
  new MessagesPlaceholder("agent_scratchpad"),
]);

const tools =[searchTool];




const getAPIResponse = async (chatId: number, message: string,modelType:AIModel,contextData?: ContextUser, streamHandler?: (chunk: string) => void) => {
  try {

    const model = modelMap(modelType) as LanguageModelLike;
    const agent = createToolCallingAgent({
      llm: model,
      tools,
      prompt: modelPrompt,
      verbose: true,
    });
    const agentExecutor = new AgentExecutor({
      agent,
      tools,
    });

    // const response = await agentExecutor.invoke(
    //   {
    //     input: message,
    //     context_string: buildSystemMessage(contextData),
    //     chat_history: messageHistory,
    //   },
      
    // );
    // console.log("Response:", response);
    
    // //@ts-ignore "@langchain/mistralai" does not have a type definition
    // const chain = modelPrompt.pipe(model).pipe(new StringOutputParser());
    const chainWithHistory = new RunnableWithMessageHistory({
      runnable: agentExecutor,
      inputMessagesKey: "input",
      historyMessagesKey: "chat_history",
  
      getMessageHistory: (sessionId: string) => {
        const chatHistory = new PostgresChatMessageHistory({
          sessionId,
          pool,
          tableName: "messages_history",
          
          
        });
        return chatHistory;
      },
    });


    
    


    const response = await chainWithHistory.stream(
      {
        input: message,
        context_string: buildSystemMessage(contextData),

      },
      {
        configurable: {
          sessionId: chatId.toString(),
          
          
        },
      }
    );



    for await (const chunk of response) {
      
      if (typeof chunk === 'string') {
        if (streamHandler) {
          streamHandler(chunk);

        }
      } else {
        logger.warn("Unexpected chunk type:", typeof chunk);
      }

    }

    


  } catch (error) {

    logger.error("Error in getAPIResponse:", new Error(String(error)), { chatId, message });
    throw error;
  }
}






const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
if (!GOOGLE_API_KEY) {
  throw new Error("Missing GOOGLE_API_KEY in environment variables.");
}
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY)
const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-lite",
})
const generateTitleWithGemini = async (message: string) => {
  if (!GOOGLE_API_KEY) {
    throw new Error("Missing GOOGLE_API_KEY in environment variables.");
  }
  try {
    const result = await geminiModel.generateContent(message);
    const response = result.response;
    const title = response.text().trim();
    return title;
  } catch (error) {
    logger.error("Error in generateTitleWithGemini:", new Error(String(error)), { message });
    throw error;
  }
}

export { getAPIResponse, generateTitleWithGemini  };