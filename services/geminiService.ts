import { Category } from "../types";

// Use Vercel API route only in production
const API_ENDPOINT = '/api/deepseek';

async function callDeepSeek(model: string, messages: any[], temperature: number, response_format?: any) {
  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      response_format
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API request failed: ${response.status}`);
  }

  return response.json();
}

export const parseTransactionPrompt = async (text: string, categories: Category[]) => {
  const categoryNames = categories.map(c => `${c.name} (${c.type})`).join(', ');

  const data = await callDeepSeek(
    'deepseek-chat',
    [
      {
        role: 'system',
        content: 'You are a financial transaction parser. Always respond with valid JSON only.'
      },
      {
        role: 'user',
        content: `Parse this spending note: "${text}".
Categorize it into one of these: [${categoryNames}].
If no clear category, pick the closest one or "Shopping".
Return JSON with: amount (number), categoryName (string), type ("income" or "expense"), note (string, optional).`
      }
    ],
    0.3,
    { type: 'json_object' }
  );

  try {
    const content = data.choices[0]?.message?.content || '{}';
    return JSON.parse(content);
  } catch (e) {
    return null;
  }
};

export const parseReceiptImage = async (base64Data: string, mimeType: string, categories: Category[]) => {
  // DeepSeek doesn't support vision API yet
  console.warn('Receipt image parsing is not supported with DeepSeek');
  return null;
};

export const getFinancialAdvice = async (summary: string) => {
  const data = await callDeepSeek(
    'deepseek-reasoner',
    [
      {
        role: 'system',
        content: 'You are a professional financial coach. Provide clear, actionable advice.'
      },
      {
        role: 'user',
        content: `Analyze this monthly summary and provide 3 actionable, highly specific tips to improve their financial health.
Summary: ${summary}
Keep it concise and encouraging.`
      }
    ],
    0.7
  );

  return data.choices[0]?.message?.content || 'Unable to generate advice at this time.';
};
