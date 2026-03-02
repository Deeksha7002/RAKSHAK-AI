# 🚀 Deploying Rakshak AI to the Cloud

This guide walks you through deploying the app publicly using **Render** (backend) and **Vercel** (frontend). Once done, anyone can access the app from any device.

---

## Step 1: Deploy Backend to Render

1. Go to [render.com](https://render.com) and sign up / log in with your GitHub account.
2. Click **"New +"** → **"Web Service"**.
3. Connect your GitHub account and select the **`Scam_defender_honeypot`** repository.
4. Render will auto-detect the `render.yaml` file and fill in the settings.
5. **Environment Variables** — Add this in the Render dashboard:
   - `DATABASE_URL` → `sqlite:////data/rakshak_ai.db`
   - `SECRET_KEY` → (click "Generate" — Render does this automatically from render.yaml)
6. Click **"Create Web Service"** and wait for the build to finish (~3 minutes).
7. Copy your backend URL, it will look like:  
   `https://rakshak-ai-backend.onrender.com`

---

## Step 2: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up / log in with your GitHub account.
2. Click **"Add New Project"** → import **`Scam_defender_honeypot`** from GitHub.
3. Vercel auto-detects the `vercel.json` settings.
4. Under **"Environment Variables"**, add:
   - **Name:** `VITE_API_URL`  
   - **Value:** `https://scam-defender-backend.onrender.com` ← (your Render URL from Step 1)
5. Click **"Deploy"** and wait (~2 minutes).
6. Your app is live! Vercel gives you a URL like:  
   `https://rakshak-ai.vercel.app`

---

## Step 3: Share & Use

- Send your Vercel URL to anyone.
- They open the URL in any browser on any device.
- They click **"Register"** → create their own **Operator ID** and **Password**.
- They log in and immediately have full access.

---

## ⚠️ Important Notes

- **Free Render plan:** The backend goes to sleep after 15 minutes of no traffic. The first request after sleeping takes ~30 seconds to wake up. This is normal.
- **SQLite on Render:** Data is stored on a persistent 1GB disk at `/data/`. Your cases and registered users will survive server restarts.
- **Biometric login:** Only works on `localhost` or HTTPS domains. Vercel provides HTTPS by default, so biometrics will work on the deployed app!
