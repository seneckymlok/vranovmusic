/**
 * Generates a simple browser fingerprint to identify unique visitors
 * without requiring a login.
 * 
 * Note: This is not 100% secure against determined spoofing, 
 * but prevents simple "incognito/clear cache" bypasses.
 */
export const getBrowserFingerprint = async (): Promise<string> => {
    const { userAgent, language, hardwareConcurrency } = navigator;
    const { width, height, colorDepth } = screen;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Combine reliable browser traits
    const data = [
        userAgent,
        language,
        hardwareConcurrency,
        width,
        height,
        colorDepth,
        timezone
    ].join('|');

    // Hash the string using SHA-256
    const msgBuffer = new TextEncoder().encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex;
};
