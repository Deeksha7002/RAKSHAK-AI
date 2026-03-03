export type PersonaType = 'ELDERLY' | 'INVESTOR' | 'CITIZEN' | 'SKEPTICAL';

export const PERSONAS: Record<PersonaType, { role: string, description: string }> = {
    ELDERLY: {
        role: "Confused Senior",
        description: "A slow, technologically illiterate senior citizen. Uses simple language, gets confused easily, and asks for help from 'grandsons'."
    },
    INVESTOR: {
        role: "Greedy Investor",
        description: "Eager, money-focused, and slightly arrogant. Wants 'guaranteed returns' and actively leads the conversation towards profit."
    },
    CITIZEN: {
        role: "Scared Citizen",
        description: "Anxious, apologetic, and compliant. Terrified of authority (police/IRS) and wants to resolve 'trouble' immediately."
    },
    SKEPTICAL: {
        role: "Skeptical SysAdmin",
        description: "Suspicious, technical, and annoying. Asks for proof, logs, and identity verification. Wastes time by finding 'security issues'."
    }
};

export const RESPONSE_TEMPLATES: Record<PersonaType, Record<string, string[]>> = {
    ELDERLY: {
        GREETING: [
            "Hello? Who is this?",
            "Hi, did my grandson give you this number?",
            "I'm a bit busy with my knitting, but I'm listening.",
            "Is this the computer repair man?",
            "Hello, are you calling about the internet?"
        ],
        LINKS: [
            "I clicked the blue text but the screen just went white.",
            "It says '404 Error'. Do I need to double-click?",
            "My grandson told me not to click on strange things.",
            "I'm clicking but nothing happens. Is it because I'm on an iPad?",
            "Which link? The top one or the bottom one?"
        ],
        URGENCY: [
            "Please don't yell at me, I'm typing as fast as I can.",
            "Hold on, there's someone at the door. Be right back.",
            "I'm getting confused, you're going too fast.",
            "Let me just find my reading glasses...",
            "I need to take my heart medication, one moment."
        ],
        MONEY: [
            "Okay, I found my card. It says 'Vista' on it.",
            "I don't do online banking. Can I mail a check?",
            "My password is {password}, maybe you can check for me?",
            "I have $500 in my savings, is that enough?",
            "Do you accept cash? I have some under the mattress."
        ],
        CODES: [
            "I got a code, it is {otp}. Is that the one?",
            "Is the code the big number or the small one?",
            "I'm looking... is it in my email or the text?",
            "My phone buzzed but I don't see anything.",
            "Do I read this out loud on the phone?"
        ],
        QUESTION: [
            "Yes, just looking for my glasses.",
            "I'm trying to follow along, sorry.",
            "One moment, my cat is on the keyboard.",
            "I'm listening, go ahead.",
            "Could you speak up a little bit?"
        ],
        GENERAL: [
            "I'm sorry, I'm not very good with computers.",
            "Could you explain that one more time?",
            "I'm confused, what do I need to do?",
            "My grandson usually helps me with this.",
            "Is there a phone number I can call back?"
        ]
    },
    INVESTOR: {
        GREETING: [
            "Yeah, I'm here. This about the opportunity?",
            "Hello. ROI looks good? Talk to me.",
            "Hi. Is this the investment manager?",
            "I'm ready to move some capital if the numbers work.",
            "Who is this? I'm expecting a call about Crypto."
        ],
        LINKS: [
            "Link's not loading. Send me the contract PDF instead.",
            "Is this the secure portal? Looks a bit cheap.",
            "I'll check the dashboard later. Just give me the wallet address.",
            "Cannot access. firewall blocking it.",
            "Just tell me the yield, I don't need a website."
        ],
        URGENCY: [
            "Relax, money takes time to move.",
            "I'm moving $50k, I need to be sure.",
            "Don't rush me. I do due diligence.",
            "I'm on a call with my broker, give me a sec.",
            "If you rush me, I walk. Simple as that."
        ],
        MONEY: [
            "Limit is $10k per day. Is that an issue?",
            "Which wallet? BTC or ETH? I prefer ETH.",
            "I can wire $20,000 today if the return is guaranteed.",
            "Here is the wallet: {credit_card} (Wait, wrong paste).",
            "Do you take USDT? Fees are lower."
        ],
        CODES: [
            "Code is {otp}. Verify it fast.",
            "Did you get the PIN? {otp}.",
            "Here's the 2FA: {otp}. Proceed.",
            "Validating transaction... Code: {otp}.",
            "Sent the code. Let's close this deal."
        ],
        QUESTION: [
            "I'm analyzing the charts. Go on.",
            "Still here. Just checking the market cap.",
            "Yeah, hearing you. What's the upside?",
            "Listening. Is this risk-free?",
            "Go ahead. Pitch me."
        ],
        GENERAL: [
            "What's the guaranteed APR?",
            "Is this SEC regulated? (Just kidding, I don't care).",
            "How fast can I withdraw my profits?",
            "Send me the whitepaper.",
            "I've seen better returns on Coinbase."
        ]
    },
    CITIZEN: {
        GREETING: [
            "Hello? Is this the officer?",
            "Yes, this is [Name]. I didn't do it.",
            "Hi, I received a voicemail about a warrant?",
            "Please don't arrest me. I'm listening.",
            "Hello? Federal Department?"
        ],
        LINKS: [
            "I clicked it. Is my computer seized now?",
            "It says 'Government Access'. Should I proceed?",
            "I'm too scared to click. Can I just pay?",
            "Will this clear my record if I click?",
            "The screen went red. Did I do something wrong?"
        ],
        URGENCY: [
            "Please, I'm crying, give me a minute.",
            "My hands are shaking, sorry.",
            "Don't send the police yet! I'm trying!",
            "I'm looking for my husband's card. Please wait.",
            "I don't want to go to jail. Just one second."
        ],
        MONEY: [
            "I can pay the fine. Here is the card: {credit_card}.",
            "I have $2000 in savings. Will that stop the warrant?",
            "Do I pay the IRS directly or to you?",
            "Here is my husband's card: {credit_card}. Please works.",
            "Can I buy those Target cards to pay the tax?"
        ],
        CODES: [
            "The verification code is {otp}. Am I safe now?",
            "I read the code: {otp}. Did it work?",
            "Here is the numbers: {otp}. Please stop the police.",
            "I got a text from 'GovAlert'. Code is {otp}.",
            "Is this the code to cancel the arrest?"
        ],
        QUESTION: [
            "I'm here. Please don't hang up.",
            "Yes officer, I understand.",
            "I'm doing exactly what you say.",
            "Yes, I'm listening. Please help me.",
            "I promise I won't do it again."
        ],
        GENERAL: [
            "Am I going to jail?",
            "I've never broken a law in my life.",
            "Please help me resolve this misunderstanding.",
            "Do I need a lawyer?",
            "I'm a good citizen, I swear."
        ]
    },
    SKEPTICAL: {
        GREETING: [
            "Who is this?",
            "I don't recognize this number.",
            "State your business.",
            "This is a recorded line.",
            "How did you get this contact?"
        ],
        LINKS: [
            "I'm not clicking that.",
            "That domain was registered 2 days ago.",
            "Send me the official documentation.",
            "I'll verify this through the main channel.",
            "Why is the URL using HTTP?"
        ],
        URGENCY: [
            "I don't react to improved urgency.",
            "If it's important, send a certified letter.",
            "I have all day.",
            "Your panic tactics aren't working.",
            "I'll get to it when I get to it."
        ],
        MONEY: [
            "I don't authorize transfers over chat.",
            "What is the merchant category code?",
            "I only use escrow services.",
            "Send me an invoice first.",
            "I need a valid routing number."
        ],
        CODES: [
            "I don't share OTPs.",
            "Read me the code you have.",
            "Why do you need a client-side code?",
            "I'm using a hardware token.",
            "This violates security policy."
        ],
        QUESTION: [
            "What protocol is this?",
            "Can you prove your identity?",
            "I'm tracing this connection.",
            "What is your employee ID?",
            "I'm recording this call."
        ],
        GENERAL: [
            "This seems irregular.",
            "I'm forwarding this to security.",
            "Convince me.",
            "I have doubts about this.",
            "Proceed with caution."
        ]
    }
};

export const SENSITIVE_PATTERNS: Record<string, RegExp> = {
    CREDIT_CARD: /\b(?:\d[ -]*?){13,16}\b/g,
    EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    PHONE: /\b(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})\b/g,
    SSN: /\b\d{3}-\d{2}-\d{4}\b/g,
    CRYPTO_BTC: /\b(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}\b/g,
    CRYPTO_ETH: /\b0x[a-fA-F0-9]{40}\b/g
};

export const UNSAFE_KEYWORDS = [
    "send money", "transfer", "bank account", "password", "login", "otp", "pin", "cvv"
];

// Dynamically resolve the backend URL — relative requests are proxied via Vite/Nginx
// @ts-ignore
const rawUrl = (import.meta as any).env?.VITE_API_URL || '';
if (!rawUrl && !import.meta.env.DEV) {
    console.error("🚨 CRITICAL: VITE_API_URL is not set in production. Frontend will attempt relative calls, which may fail.");
}

export const API_BASE_URL = rawUrl;
