import { HfInference } from "npm:@huggingface/inference";
import "jsr:@std/dotenv/load";
import {Mistral} from "@mistralai/mistralai";
const InferenceSession = new HfInference(Deno.env.get("HF_API_KEY"));

const model="mistralai/Mistral-Nemo-Instruct-2407";

const client = new Mistral({
  apiKey: Deno.env.get("MISTRAL_API_KEY"),
});

const context = `You are an AI medical assistant. Your task is to analyze the given text and provide a possible diagnosis based on the symptoms and information provided.
Consider the entities marked in the text (if any) and their relevance to potential medical conditions.`;


const getAPIResponse = async (message: string,streamHandler?: (chunk: string) => Promise<void>) => {
  try {
    const response = await client.chat.stream({
      temperature:0.7,
      model: 'mistral-small-latest',
      messages: [
        { role: "system", content: context },
        { role: "user", content: message },
      ],
    });

    for await ( const chunk of response)
    {
      if(chunk?.data.choices[0].delta.content)
      {
        const streamText = chunk.data.choices[0].delta.content;
        if (typeof streamText === 'string') {
          Deno.stdout.write(new TextEncoder().encode(streamText));
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
const getAIresponse = async (messages: any, streamHandler?: (chunk: string) => Promise<void>) => {
 
  try {
    for await (const chunk of InferenceSession.chatCompletionStream({
      model: model,
      
      messages: [
        { role: "system", content: context },
        { role: "user", content: messages },
      ],
    })) {
      const content = chunk.choices[0]?.delta?.content || "";
      Deno.stdout.write(new TextEncoder().encode(content));
      if (streamHandler) {
        await streamHandler(content);
      }
    }
  } catch (error) {
    console.error("Error in LLM processing:", error);
    throw error;
  }
};

export { getAIresponse , getAPIResponse };