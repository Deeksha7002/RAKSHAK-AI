/**
 * Forensic Cryptography Utilities
 * Provides SHA-256 hashing for data integrity and chain of custody.
 */
export class CryptoUtils {
    /**
     * Generates a SHA-256 hash of the provided data object.
     * Used to "seal" evidence and detect tampering.
     */
    public static async generateSignature(data: any): Promise<string> {
        const msgUint8 = new TextEncoder().encode(JSON.stringify(data));
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    /**
     * Verifies if the data matches the provided signature.
     */
    public static async verifySignature(data: any, signature: string): Promise<boolean> {
        const currentSignature = await this.generateSignature(data);
        return currentSignature === signature;
    }
}
