  Google Gemini API Free Tier Limits

  Free Quota (per month)

  - 15 requests per minute (rate limit)
  - 1,500 requests per day
  - 15,000 tokens per minute (input + output)
  - Approximately 1-2 million total tokens per month

  Your App's Gemini Usage

  Transaction Parsing (parseTransactionPrompt):
  - Uses gemini-3-flash-preview (cheaper model)
  - Each request ~50-100 tokens
  - 1,500 requests = ~75,000-150,000 tokens/month

  Receipt Image Parsing (parseReceiptImage):
  - Uses gemini-3-flash-preview
  - Each request ~200-400 tokens (image + text)
  - 1,500 requests = ~300,000-600,000 tokens/month

  Financial Advice (getFinancialAdvice):
  - Uses gemini-3-pro-preview (more expensive model)
  - Each request ~1,000-2,000 tokens
  - 1,500 requests = ~1.5-3 million tokens/month

  Real-World User Capacity

  Conservative Estimate (per user per month):
  - Transaction parsing: 20-30 requests
  - Receipt scanning: 5-10 requests
  - Financial advice: 2-3 requests
  - Total: ~27-43 requests per user per month

  Free Tier Supports:
  - 35-55 active users using all features regularly
  - 150+ users if they mainly use transaction parsing
  - 500+ users for minimal AI usage

  Cost Optimization Strategies

  1. Cache common transaction patterns locally
  2. Batch multiple transactions in single requests
  3. Use cheaper models for simple tasks (flash vs pro)
  4. Implement rate limiting per user
  5. Fallback to manual entry when quota exceeded

  Monitoring & Alerts

  Set up usage monitoring to track:
  - Daily/monthly request counts
  - Token usage patterns
  - Peak usage times

  Bottom Line: Your free tier can comfortably support 50-100 regular users with moderate AI usage. The
   database (1GB storage) will likely become your bottleneck before Gemini API limits for a typical
  finance app user base.
  Google Gemini API Free Tier Limits

  Free Quota (per month)

  - 15 requests per minute (rate limit)
  - 1,500 requests per day
  - 15,000 tokens per minute (input + output)
  - Approximately 1-2 million total tokens per month

  Your App's Gemini Usage

  Transaction Parsing (parseTransactionPrompt):
  - Uses gemini-3-flash-preview (cheaper model)
  - Each request ~50-100 tokens
  - 1,500 requests = ~75,000-150,000 tokens/month

  Receipt Image Parsing (parseReceiptImage):
  - Uses gemini-3-flash-preview
  - Each request ~200-400 tokens (image + text)
  - 1,500 requests = ~300,000-600,000 tokens/month

  Financial Advice (getFinancialAdvice):
  - Uses gemini-3-pro-preview (more expensive model)
  - Each request ~1,000-2,000 tokens
  - 1,500 requests = ~1.5-3 million tokens/month

  Real-World User Capacity

  Conservative Estimate (per user per month):
  - Transaction parsing: 20-30 requests
  - Receipt scanning: 5-10 requests
  - Financial advice: 2-3 requests
  - Total: ~27-43 requests per user per month

  Free Tier Supports:
  - 35-55 active users using all features regularly
  - 150+ users if they mainly use transaction parsing
  - 500+ users for minimal AI usage

  Cost Optimization Strategies

  1. Cache common transaction patterns locally
  2. Batch multiple transactions in single requests
  3. Use cheaper models for simple tasks (flash vs pro)
  4. Implement rate limiting per user
  5. Fallback to manual entry when quota exceeded

  Monitoring & Alerts

  Set up usage monitoring to track:
  - Daily/monthly request counts
  - Token usage patterns
  - Peak usage times

  Bottom Line: Your free tier can comfortably support 50-100 regular users with moderate AI usage. The
   database (1GB storage) will likely become your bottleneck before Gemini API limits for a typical
  finance app user base.
