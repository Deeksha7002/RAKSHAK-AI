# 💬 Rakshak AI — SecureChat Threat Simulator

A standalone **WhatsApp-like messaging application** built to validate and benchmark the Rakshak AI threat interception engine under realistic, real-world conversational conditions.

---

## 🚀 Quick Start

### Option A: Double-Click (Easiest)
Double-click `start.bat` inside this folder. It will automatically:
1. Install all dependencies on first run.
2. Launch the app at **http://localhost:5176**

### Option B: Manual Terminal
```bash
# 1. Install dependencies (first time only)
npm install

# 2. Start the dev server
npm run dev

# 3. Open browser at:
# http://localhost:5176
```

---

## 🔧 Connecting to Rakshak AI Backend

1. Make sure your **Rakshak AI backend** is running on `http://localhost:8000`.  
   *(Run `python server.py` from the `/backend` folder, or use `start_ecosystem.bat`)*
2. In the SecureChat app, click the **⚙️ Settings gear** (top-left).
3. Enter your API URL (`http://localhost:8000`), username, and password.
4. Click **CONNECT BRIDGE** — the status dot will turn green.

---

## 🧪 What This App Tests

| Feature | How It's Tested |
|---|---|
| **Scam Link Detection** | Preloaded Romance Scammer & Job Fraud contacts with phishing URLs |
| **Cyberbullying / Abuse** | Anonymous Troll contact with harassment language |
| **PII Redaction (Decoy Proxy)** | Type your Aadhaar/password in the Threat Lab Sandbox |
| **Normal Conversation (Benign)** | "Friend" contact with safe, everyday messages |
| **Automated Corpus Test** | Click "RUN SCENARIO TEST SUITE" in the right HUD panel |

---

## 📊 Metrics Tracked (Right Panel HUD)

- **F1-Score** — Harmonic balance of Precision and Recall
- **Precision** — Of all messages Rakshak blocked, how many were real threats
- **Recall** — Of all real threats, how many Rakshak caught
- **Confusion Matrix** — Live TP / FP / FN / TN ledger
- **Scan Overhead (ms)** — Time Rakshak adds to each message delivery

---

## 🏗️ Architecture

```
[User types message] → [SecureChat Server] → POST /api/analyze → [Rakshak AI Brain]
                                                                        ↓
                                                        ALLOW / BLOCK / REDACT (Decoy Bait)
                                                                        ↓
                                              [Message delivered / blocked / bait-swapped]
```

---

## 📁 Project Structure

```
securechat-simulator/
├── src/
│   ├── App.tsx          # Main WhatsApp UI + Rakshak integration
│   ├── index.css        # Dark-mode cyber aesthetic styles
│   └── main.tsx         # React entry point
├── index.html           # HTML entry shell
├── package.json         # Dependencies (React + Vite)
├── vite.config.ts       # Vite build config (port 5176)
├── tsconfig.json        # TypeScript config
└── start.bat            # One-click launcher (Windows)
```
