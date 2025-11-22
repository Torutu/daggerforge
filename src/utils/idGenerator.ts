/**
 * Generate a unique ID for adversaries and environments
 * Format: "id_" + timestamp + randomString
 * 
 * @returns A unique string identifier
 */
export function generateUniqueId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    return `id_${timestamp}_${random}`;
}
