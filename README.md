# Rakshak AI 🛡️🤖

An AI-powered Rakshak system designed to engage with and analyze scammers in real-time. This project uses multiple personas to trap scammers, extract intelligence, and generate evidence for cybersecurity teams.

## 🚀 Features

- **Multi-Persona AI**: Choose between different personas (Cautious Alex, Trusting Grandma Betty, Skeptical SysAdmin Dave) to engage scammers effectively.
- **Real-time Dashboard**: Monitor active scam threads, threat levels, and geographical origins.
- **Intelligence Extraction**: Automatically identifies and redacts sensitive information while extracting scammer tactics.
- **Evidence Locker**: Generates comprehensive PDF and JSON reports for reporting to cybersecurity departments.
- **Responsive Web App**: A modern, Cyber-themed UI built with React, Vite, and Tailwind CSS.

## 🏗️ Architecture

- **frontend/**: A Vite-powered React application providing the user interface and dashboard metrics.
- **backend/**: Handles the AI logic, persona management, and core Rakshak analysis routines.
- **PWA Support**: Can be installed as a Progressive Web App for a native-like experience on desktop and mobile.

## 🛡️ Zero-Trust Forensic Architecture

The system employs a **Defense-in-Depth** heuristic engine to detect sophisticated deepfakes, moving beyond simple keyword matching.

### 1. The 6-Gate Neural Consensus
Every media file must pass **all 6 forensic gates** to be trusted:
- **Optical**: Analyzes lighting vectors, shadow consistency, and reflection mapping.
- **Structural**: Inspects cranial geometry, ear symmetry, and biological texture density.
- **Fidelity**: Scans for GAN-noise residues, compression artifacts, and pixel-grid alignment.
- **Semantic**: Verifies logical consistency (e.g., gravity, object permanence, background context).
- **Metadata**: Checks for altered EXIF data and known synthetic tool signatures.
- **Environmental**: Cross-references ambient noise/lighting with the subject's environment.

### 2. The 90% Security Baseline
- **Zero-Trust**: Any authenticity score below **90%** triggers a `Manipulated` verdict.
- **Auto-Reporting**: High-confidence threats (Score < 90%) are automatically packaged into a generic evidence file (JSON + PDF) and flagged for the Cyber Cell.

### 3. Privacy & Governance
- **Local-First**: All analysis happens client-side. No raw images/audio leave the device.
- **Digital Shredder**: Malicious payloads are wiped from memory immediately after evidence extraction.

## 🛠️ Setup & Running

### Requirements
- Python 3.x
- Node.js & npm

### Quickly Start the Application
Run the provided batch script to start both the backend and frontend components:
```bash
./start_app.bat
```

### Manual Setup
1. **Backend**:
   ```bash
   pip install -r requirements.txt
   python main.py
   ```
2. **Frontend**:
   ```bash
   cd web-app
   npm install
   npm run dev
   ```

## 📜 License
This project is licensed under the MIT License.
