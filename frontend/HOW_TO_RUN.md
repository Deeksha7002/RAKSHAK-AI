# How to Run the Rakshak AI Defense App

This guide explains how to run the application on your local machine or send it to others.

## Prerequisites

You need **Node.js** installed on your computer.
[Download Node.js here](https://nodejs.org/) (LTS version recommended).

## Option 1: Running for Development (Source Code)

If you have the source code folder:

1.  Open a terminal (Command Prompt or PowerShell) in this folder.
2.  Install dependencies (do this once):
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
4.  Open the link shown in the terminal (usually `http://localhost:5173`) in your browser.

## Option 2: Running the Built Version (Standalone)

If you want to run the app without the development tools, or send it to someone else:

1.  **Build the App:**
    Run this command to create a `dist` folder containing the standalone app:
    ```bash
    npm run build
    ```

2.  **Run the App:**
    You can serve the `dist` folder using a static file server.
    
    The easiest way is to use `preview` command:
    ```bash
    npm run preview
    ```
    
    **OR** manually using `serve`:
    ```bash
    npx serve dist
    ```

3.  **Sending to Others:**
    - Run `npm run build`.
    - Zip the entire `dist` folder.
    - Send the Zip file.
    - The recipient needs to unzip it and can run it using a local web server (opening `index.html` directly might work but some features require a server due to browser security policies).

## Troubleshooting

-   **"Command not found"**: Make sure Node.js is installed and you restarted your terminal.
-   **Blank screen**: Open the browser console (F12) to see errors. If running from file (`file://`), browser security might block some scripts. Use `npm run preview` or a local server.
