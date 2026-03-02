import { SENSITIVE_PATTERNS } from './config';

export interface EgressPackage {
    id: string;
    destination: string;
    payload: any;
    authorized: boolean;
}

export class EgressFilter {
    /**
     * Inspects a payload for PII before transmission.
     * Returns true if the package is safe to send.
     */
    public static inspect(payload: any): { isSafe: boolean; violations: string[] } {
        const violations: string[] = [];
        const payloadString = JSON.stringify(payload);

        Object.entries(SENSITIVE_PATTERNS).forEach(([type, pattern]: [string, RegExp]) => {
            if (pattern.test(payloadString)) {
                violations.push(`Unredacted PII detected: ${type}`);
            }
        });

        return {
            isSafe: violations.length === 0,
            violations
        };
    }

    /**
     * Wraps a payload in a security envelope.
     */
    public static wrap(destination: string, payload: any, authorized: boolean): EgressPackage {
        return {
            id: `egress-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            destination,
            payload,
            authorized
        };
    }
}
