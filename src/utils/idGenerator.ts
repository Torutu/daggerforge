/**
 * Generate a unique ID for adversaries and environments
 * Format: "id_" + timestamp + randomString
 * 
 * @returns A unique string identifier
 */
export function generateAdvUniqueId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    return `CUA_${timestamp}_${random}`;
}

export function generateEnvUniqueId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    return `CUE_${timestamp}_${random}`;
}
