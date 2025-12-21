import { GoogleGenAI, Type } from "@google/genai";
import { Category, TransactionType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const TRANSACTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    amount: { type: Type.NUMBER },
    categoryName: { type: Type.STRING },
    type: { type: Type.STRING, enum: ['income', 'expense'] },
    note: { type: Type.STRING }
  },
  required: ['amount', 'categoryName', 'type']
};

export const parseTransactionPrompt = async (text: string, categories: Category[]) => {
  const categoryNames = categories.map(c => `${c.name} (${c.type})`).join(', ');
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Parse this spending note: "${text}". 
    Categorize it into one of these: [${categoryNames}].
    If no clear category, pick the closest one or "Shopping".
    Return JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: TRANSACTION_SCHEMA
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return null;
  }
};

export const parseReceiptImage = async (base64Data: string, mimeType: string, categories: Category[]) => {
  const categoryNames = categories.map(c => `${c.name} (${c.type})`).join(', ');
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        },
        {
          text: `Extract the total amount, store name (for the note field), and categorize this receipt into one of these: [${categoryNames}]. 
          Return JSON. Only extract values if clearly visible.`
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: TRANSACTION_SCHEMA
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return null;
  }
};

export const getFinancialAdvice = async (summary: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `You are a professional financial coach. Analyze this monthly summary and provide 3 actionable, highly specific tips to improve their financial health. 
    Summary: ${summary}
    Keep it concise and encouraging.`,
    config: {
      thinkingConfig: { thinkingBudget: 2000 }
    }
  });
  return response.text;
};