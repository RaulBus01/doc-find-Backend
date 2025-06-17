import "jsr:@std/dotenv/load";

import {  HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { ContextUser } from "../types/ContextType.ts";

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { Logger } from "../utils/logger.ts";
const logger = new Logger("AIService");
import { graph } from "../langgraph/graph.ts";
import { HumanMessage } from "@langchain/core/messages";


const getAPIResponse = async (chatId: string, message: string, contextData?: ContextUser, streamHandler?: (chunk: string) => void, abortSignal?: AbortSignal) => {
  try {

    const config = { configurable: { thread_id: chatId.toString() }, version: "v2" as const, streamMode: "messages" as const, signal: abortSignal };
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
      if (abortSignal?.aborted) {
        logger.warn("Streaming aborted by client");
        break;
      }
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

            const aiMessage = messages.find((m: { constructor: { name: string | string[]; }; }) => m.constructor.name.includes('AIMessage'));
            if (aiMessage && aiMessage.content && streamHandler) {
              streamHandler(aiMessage.content);
            }
          }
        }
      }


      else if (typeof chunk === 'string' && streamHandler) {
        streamHandler(chunk);
      }
    }


  } catch (error) {

    logger.error("Error in getAPIResponse:", new Error(String(error)), { chatId, message });
    throw error;
  }
}

const generateTitleWithGemini = async (prompt: string, message: string) => {
  const modelPrompt = ChatPromptTemplate.fromMessages([
    ["system", prompt],
    new MessagesPlaceholder("messages"),
  ]);
  const model = new ChatGoogleGenerativeAI({
    apiKey: Deno.env.get("GOOGLE_API_KEY"),
    model: "gemini-2.0-flash-lite",
    temperature: 0.7,
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
      }
    ]
  });
  try {
    //@ts-ignore lang chain type error
    const response = await modelPrompt.pipe(model).invoke(
      {
        messages: [
          new HumanMessage({ content: message }),
        ],
      }
    );
    const title = response.content;
    return title;
  } catch (error) {
    logger.error("Error in generateTitleWithGemini:", new Error(String(error)), { message });
    throw error;
  }
}

export { getAPIResponse, generateTitleWithGemini };