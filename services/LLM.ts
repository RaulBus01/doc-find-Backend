import { HfInference } from "npm:@huggingface/inference";
import "jsr:@std/dotenv/load";
import {Mistral} from "@mistralai/mistralai";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai"; 
import { ContextUser } from "../types/ContextType.ts";

const InferenceSession = new HfInference(Deno.env.get("HF_API_KEY"));
const model="mistralai/Mistral-Nemo-Instruct-2407";

const mistralApiKey = Deno.env.get("MISTRAL_API_KEY");
if (!mistralApiKey) {
  throw new Error("Missing MISTRAL_API_KEY in environment variables.");
}
console.debug("MISTRAL_API_KEY loaded:", !!mistralApiKey);

const client = new Mistral({
  apiKey: mistralApiKey,
});

const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
if (!GOOGLE_API_KEY) {
  throw new Error("Missing GOOGLE_API_KEY in environment variables.");
}
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY)
const geminiModel = genAI.getGenerativeModel({
  model:"gemini-2.0-flash-lite",
})

const context = `You are an AI medical assistant. Your task is to analyze the given text and provide a possible diagnosis based on the symptoms and information provided.
Consider the entities marked in the text (if any) and their relevance to potential medical conditions.`;

const buildSystemMessage = (context: string, contextData?: ContextUser) => {
  if (!contextData) {
    return context;
  }
  const contextString = Object.entries(contextData)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
  console.log("Context String:", contextString); // Log the context
  return `${context} with the following context about patient: ${contextString}`;
}


const getAPIResponse = async (message: string,contextData?:ContextUser,streamHandler?: (chunk: string) => Promise<void>) => {
  try {
    const response = await client.chat.stream({
      temperature:0.7,
      model: 'mistral-large-latest',
      messages: [

        { role: "system", content: buildSystemMessage(context, contextData) },
        { role: "user", content: message },
      ],
    });

    for await ( const chunk of response)
    {
      if(chunk?.data.choices[0].delta.content)
      {
        const streamText = chunk.data.choices[0].delta.content;
        if (typeof streamText === 'string') {
          if(streamHandler)
          {
          await streamHandler(streamText);
          }
        } else {
          console.warn('Received non-string content:', streamText);
        }
      }
    }

  
  } catch (error) {
    console.error("Error in API processing:", error);
    throw error;
  }
}
// const getAIresponse = async (messages: string, context:ContextUser, streamHandler?: (chunk: string) => Promise<void>) => {
 
//   try {
//     for await (const chunk of InferenceSession.chatCompletionStream({
//       model: model,
      
//       messages: [
//         { role: "system", content: context },
//         { role: "user", content: messages },
//       ],
//     })) {
//       const content = chunk.choices[0]?.delta?.content || "";
//       // Deno.stdout.write(new TextEncoder().encode(content));
//       if (streamHandler) {
//         await streamHandler(content);
//       }
//     }
//   } catch (error) {
//     console.error("Error in LLM processing:", error);
//     throw error;
//   }
// };

const generateTitleWithGemini = async (message: string) => {
  if(!GOOGLE_API_KEY) {
    throw new Error("Missing GOOGLE_API_KEY in environment variables.");
  }
  try{
    const result = await geminiModel.generateContent(message);
    const response = result.response;
    const title = response.text().trim();
    return title;
  } catch (error) {
    console.error("Error in Gemini processing:", error);
    throw error;
  }
}

export { getAPIResponse, generateTitleWithGemini };