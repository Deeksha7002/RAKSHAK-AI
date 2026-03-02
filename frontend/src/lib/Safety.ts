import { SENSITIVE_PATTERNS, UNSAFE_KEYWORDS } from './config';

export class SafetyGuard {
    static redactPII(text: string): string {
        let redactedText = text;

        Object.entries(SENSITIVE_PATTERNS).forEach(([type, pattern]: [string, RegExp]) => {
            redactedText = redactedText.replace(pattern, `[REDACTED: ${type}]`);
        });

        return redactedText;
    }

    static checkPolicy(responseText: string): boolean {
        const lower = responseText.toLowerCase();
        return !UNSAFE_KEYWORDS.some(keyword => lower.includes(keyword));
    }
}
