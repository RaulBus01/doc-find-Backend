import { HfInference } from "npm:@huggingface/inference";
import "jsr:@std/dotenv/load";
const InferenceSession = new HfInference(Deno.env.get("HF_API_KEY"));

const model = "ProbeMedicalYonseiMAILab/medllama3-v20";

const messages = [{ role: "user", content: "Who are you?" }];

const getAIresponse = async (messages: any) => {
  const context = `You are an AI medical assistant. Your task is to analyze the given text and provide a possible diagnosis based on the symptoms and information provided.
  Consider the entities marked in the text (if any) and their relevance to potential medical conditions.`;
  try {
    let response = "";
    for await (const chunk of InferenceSession.chatCompletionStream({
      model: model,
      messages: [
        { role: "system", content: context },
        { role: "user", content: messages },
      ],
      max_tokens: 200,
    })) {
      const content = chunk.choices[0]?.delta?.content || "";
      response += content;
      Deno.stdout.write(new TextEncoder().encode(content));
    }
    return response;
  } catch (error) {
    console.error("Error in LLM processing:", error);
    throw error;
  }
};

export { getAIresponse };
