<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1N0UFFSqgeBw-FEzzxLlaWwmykmUXxIPB

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set `DEEPSEEK_API_KEY` for the server API route.
   For Vercel production, add it in the Vercel project environment settings.
3. If you want AI features locally, run the app with a server environment that serves `/api/deepseek`.
   `npm run dev` starts only the Vite frontend and does not run the Vercel API route.
4. Run the app:
   `npm run dev`
