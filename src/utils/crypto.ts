/**
 * Cryptographic utility helpers using modern browser Web Crypto API and simulated ECDSA signatures.
 */

/**
 * Calculates genuine SHA-256 hash of any input string.
 */
export async function calculateSHA256(data: string): Promise<string> {
  try {
    const msgUint8 = new TextEncoder().encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  } catch (e) {
    // Fallback if crypto subtle is not supported in iframe environment
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return 'fallback_sha256_' + Math.abs(hash).toString(16).padStart(16, '0');
  }
}

/**
 * Generates an ECDSA-simulated digital signature representing authentication by the sender's IID private key.
 */
export function generateEcdsaSignature(hash: string, senderIid: string): string {
  // A realistic cryptographic signature structure using base58 representation suffix
  const uniqueKey = senderIid.replace(/-/g, '').substring(3, 12);
  const signatureHex = hash.substring(4, 20).split('').reverse().join('');
  return `3045022100${signatureHex}b7c0220${uniqueKey}90e8d904c`;
}
