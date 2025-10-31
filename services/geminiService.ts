
import { GoogleGenAI } from "@google/genai";

export const generatePaymentMemo = async (context: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Generate a short, witty, or funny memo for a crypto payment. The context is: '${context}'. Keep it under 10 words. Examples: "For the pizza crusade", "Avocado toast fund", "To the moon!".`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    const text = response.text.trim().replace(/["']/g, ''); // Clean up quotes
    return text;
  } catch (error) {
    console.error("Gemini API error:", error);
    return "AI memo failed... but the thought counts!";
  }
};
