import "jsr:@std/dotenv/load";

import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory} from "@google/generative-ai";
import { ContextUser } from "../types/ContextType.ts";

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";

import { ChatMistralAI } from "@langchain/mistralai";
import { AIModel } from "../types/types.ts";

import { Logger } from "../utils/logger.ts";

const logger = new Logger("AIService");


import { graph } from "../langgraph/graph.ts";
import { AIMessage, HumanMessage } from "@langchain/core/messages";



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







const getAPIResponse = async (chatId: number, message: string,modelType:AIModel,contextData?: ContextUser, streamHandler?: (chunk: string) => void) => {
  try {

    const config = { configurable: { thread_id:chatId.toString() }, version: "v2" as const,streamMode:"messages" as const };
    const inputMessage = new HumanMessage({ content: message });

 

    const response = graph.streamEvents(
      {
        messages: [inputMessage],
        contextData: contextData,
  
      },
      config
    );

    let isStreaming = false;

    for await (const chunk of response) {
      if (typeof chunk === 'object') {
        // Extract message content from different event types
        if (chunk.event === 'on_chat_model_stream' && chunk.data?.chunk?.content) {
          // Handle streaming chunks
          if (streamHandler) {
            streamHandler(chunk.data.chunk.content);
          }
          isStreaming = true;
        } 
        else if (chunk.event === 'on_chain_end' && !isStreaming) {
          // If we haven't streamed yet, get content from the final message
          if (chunk.data?.output?.messages) {
            const messages = chunk.data.output.messages;
            // Find the last AI message in the array
            const aiMessage = messages.find(m => m.constructor.name.includes('AIMessage'));
            if (aiMessage && aiMessage.content && streamHandler) {
              streamHandler(aiMessage.content);
            }
          }
        }
      }
      
      // Handle direct string chunks (fallback)
      else if (typeof chunk === 'string' && streamHandler) {
        streamHandler(chunk);
      }
    }
  
    

    // const followUpPrompt = `Based on the conversation so far, suggest one relevant follow-up question the user might ask next.`;
    // const followUpResponse = await chainWithHistory.invoke(
    //   {
    //     input: followUpPrompt,
    //     context_string: buildSystemMessage(contextData),

    //   },
    //   {
    //     configurable: {
    //       sessionId: chatId.toString(),
    //     },
    //   }
    // );

    // console.log("Follow-up question:", followUpResponse.output);

    


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