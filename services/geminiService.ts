import { GoogleGenAI, Type } from "@google/genai";
import { Category, TransactionType } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

const TRANSACTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    amount: { type: Type.NUMBER },
    categoryName: { type: Type.STRING },
    type: { type: Type.STRING, enum: ["income", "expense"] },
    note: { type: Type.STRING },
  },
  required: ["amount", "categoryName", "type"],
};

export const parseTransactionPrompt = async (
  text: string,
  categories: Category[]
) => {
  const categoryNames = categories
    .map((c) => `${c.name} (${c.type})`)
    .join(", ");

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are a financial transaction parsing specialist. Analyze the following transaction description: "${text}".

Your task is to extract structured information and assign it to the most appropriate category from this list: [${categoryNames}].

Instructions:
- Extract the monetary amount accurately
- Determine transaction type as either "income" or "expense"
- Select the most specific category that matches; if no exact match exists, choose the closest alternative or default to "Shopping"
- Generate a concise note describing the transaction

Return the results in valid JSON format adhering to the provided schema.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: TRANSACTION_SCHEMA,
    },
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return null;
  }
};

export const parseReceiptImage = async (
  base64Data: string,
  mimeType: string,
  categories: Category[]
) => {
  const categoryNames = categories
    .map((c) => `${c.name} (${c.type})`)
    .join(", ");

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
        {
          text: `You are a receipt analysis specialist. Examine the provided receipt image and extract the following information:

Required Data:
1. Total transaction amount (extract the precise numerical value)
2. Merchant or store name (use as the transaction note)
3. Transaction category (select from: [${categoryNames}])

Guidelines:
- Only extract data that is clearly legible and unambiguous
- If the total amount is unclear, do not estimate or guess
- Choose the most appropriate category based on merchant type and context
- Default to "Shopping" only when no better category matches

Return the extracted information in valid JSON format following the specified schema.`,
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: TRANSACTION_SCHEMA,
    },
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return null;
  }
};

export const getFinancialAdvice = async (summary: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `You are a certified financial advisor specializing in personal finance optimization. Analyze the provided monthly financial summary and deliver three specific, actionable recommendations to enhance financial well-being.

Monthly Financial Summary:
${summary}

Requirements for your analysis:
- Provide exactly three distinct recommendations
- Each recommendation must be concrete and immediately implementable
- Focus on measurable financial improvements
- Address both spending optimization and financial growth opportunities
- Maintain an encouraging and supportive tone
- Structure your response with clear headings for each recommendation

Please deliver your insights in a format that empowers the user to take meaningful action toward their financial goals.`,
    config: {
      thinkingConfig: { thinkingBudget: 2000 },
    },
  });
  return response.text;
};
