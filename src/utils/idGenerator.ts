/**
 * Generate a unique ID with the given prefix
 * Format: "{prefix}_" + timestamp + randomString
 * 
 * @param prefix - The prefix for the ID (e.g., "CUA", "CUE")
 * @returns A unique string identifier
 */
function generateUniqueId(prefix: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    return `${prefix}_${timestamp}_${random}`;
}

export const generateAdvUniqueId = () => generateUniqueId('CUA');
export const generateEnvUniqueId = () => generateUniqueId('CUE');
