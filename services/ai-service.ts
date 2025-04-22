import "jsr:@std/dotenv/load";

import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory} from "@google/generative-ai";
import { ContextUser } from "../types/ContextType.ts";
import { Pool } from '@neondatabase/serverless';
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

const logger = new Logger("AIService");



const modelMap = (model: AIModel) => {
  switch (model) {
    case AIModel.MISTRAL_SMALL:
      return new ChatMistralAI({
        model: AIModel.MISTRAL_SMALL,
        temperature: 0.7,
        safePrompt: true,
        streaming: true,
      });
    case AIModel.MISTRAL_LARGE:
      return new ChatMistralAI({
        model: AIModel.MISTRAL_LARGE,
        temperature: 0.7,
        safePrompt: true,
        streaming: true,
      });
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
      return new ChatMistralAI({
        model: AIModel.MISTRAL_SMALL,
        temperature: 0.7,
        safePrompt: true,
        streaming: true,
      });
      
  }
}


const baseContext = `You are an AI medical assistant. Your task is to analyze the given text and provide a possible diagnosis based on the symptoms and information provided.
Consider the entities marked in the text (if any) and their relevance to potential medical conditions.`;

const buildSystemMessage = (contextData?: ContextUser | string) => {
  if (!contextData) {
    return baseContext;
  }
  const contextString = Object.entries(contextData)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
  return `${baseContext} with the following context about patient: ${contextString}`;
}

const poolConfig = {
  host: Deno.env.get("DB_HOST"),
  port: 5432,
  user: Deno.env.get("DB_USER"),
  password: Deno.env.get("DB_PASSWORD"),
  database: Deno.env.get("DB_NAME"),
  ssl: true
};

const pool = new Pool(poolConfig);

const modelPrompt = ChatPromptTemplate.fromMessages([
  ["system", "{context_string}"],
  new MessagesPlaceholder("chat_history"),
  ["human", "{question}"],
]);




const getAPIResponse = async (chatId: number, message: string,modelType:AIModel,contextData?: ContextUser, streamHandler?: (chunk: string) => void) => {
  try {
    const model = modelMap(modelType);
    const chain = modelPrompt.pipe(model).pipe(new StringOutputParser());
    const chainWithHistory = new RunnableWithMessageHistory({
      runnable: chain,
      inputMessagesKey: "question",
      historyMessagesKey: "chat_history",
      getMessageHistory: (sessionId: string) => {
        const chatHistory = new PostgresChatMessageHistory({
          sessionId,
          pool,
          tableName: "messagesTest",
        });
        return chatHistory;
      },
    });
    


    const response = await chainWithHistory.stream(
      {
        question: message,
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