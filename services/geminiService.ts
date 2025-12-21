
import { GoogleGenAI, Type } from "@google/genai";
import { Category, TransactionType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const parseTransactionPrompt = async (text: string, categories: Category[]) => {
  const categoryNames = categories.map(c => `${c.name} (${c.type})`).join(', ');
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Parse this spending note: "${text}". 
    Categorize it into one of these: [${categoryNames}].
    If no clear category, pick "Shopping" or "Other".
    Return JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          amount: { type: Type.NUMBER },
          categoryName: { type: Type.STRING },
          type: { type: Type.STRING, enum: ['income', 'expense'] },
          note: { type: Type.STRING }
        },
        required: ['amount', 'categoryName', 'type']
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    return null;
  }
};

export const getFinancialAdvice = async (summary: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Based on this monthly finance summary: ${summary}, give 3 very short, practical tips for this person. Keep it under 50 words total.`,
  });
  return response.text;
};
