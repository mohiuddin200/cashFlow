import { Category } from "../types";
import { auth } from "./firebase";

// Use Vercel API route only in production
const API_ENDPOINT = '/api/deepseek';

const getAiErrorMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('Unauthorized') || message.includes('401')) {
    return 'AI request failed because your session could not be verified. Please sign out and sign back in, then try again.';
  }

  if (message.includes('Too many requests') || message.includes('429')) {
    return 'AI is temporarily rate limited. Please wait a bit and try again.';
  }

  if (message.includes('DEEPSEEK_API_KEY') || message.includes('Invalid API key') || message.includes('Authentication Fails')) {
    return 'AI is unavailable because the server DeepSeek key is missing or invalid. Check the Vercel `DEEPSEEK_API_KEY` environment variable and redeploy.';
  }

  if (message.includes('404')) {
    return 'AI endpoint was not found. Local `npm run dev` does not run the `/api/deepseek` server route.';
  }

  if (message.includes('Failed to fetch')) {
    return 'AI request could not reach the server. Check your connection and confirm the deployed app can access `/api/deepseek`.';
  }

  return message;
};

async function callDeepSeek(model: string, messages: any[], temperature: number, response_format?: any) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  const currentUser = auth.currentUser;
  if (currentUser) {
    const token = await currentUser.getIdToken();
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages,
      temperature,
      response_format
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(getAiErrorMessage(errorData.error || `API request failed: ${response.status}`));
  }

  return response.json();
}

export { getAiErrorMessage };

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
