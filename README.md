<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1v-wlZX_n1NlNmGObNX4DsT_gFIbHPi9o

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local` file (copy from example):
   ```bash
   cp .env.local.example .env.local
   ```

3. Add your Gemini API key to `.env.local`:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```
   Get your API key from: https://aistudio.google.com/apikey

4. Run the app:
   ```bash
   npm run dev
   ```

## Deploy to Vercel

This app is configured to deploy to Vercel with serverless functions:

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add the `GEMINI_API_KEY` environment variable in Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add `GEMINI_API_KEY` with your API key value
4. Deploy!

Your API key will be kept secure on the server side.
