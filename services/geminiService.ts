
import { GoogleGenAI } from "@google/genai";

// Fix: Strictly following the initialization guidelines by using process.env.API_KEY directly in named parameter.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSmartWasteRecommendation = async (roomName: string, floorType: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Suggest the recommended waste percentage for flooring in a ${roomName} using ${floorType} material. Consider common US architectural standards. Return only a number.`,
      config: {
        // Fix: Explicitly disable thinking budget for simple numeric output task as recommended.
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    // Fix: Correctly access the .text property (not a method) on the GenerateContentResponse object.
    const text = response.text;
    return parseInt(text || "10");
  } catch (error) {
    console.error("AI Recommendation failed", error);
    return 10;
  }
};
