/**
 * Utility functions for filtering data by tier and source
 */

/**
 * Normalize property names to handle both lowercase and PascalCase
 */
function normalizeProperty<T>(obj: any, lowercaseKey: string, pascalKey: string): T {
	return obj[lowercaseKey] || obj[pascalKey];
}

/**
 * Get tier value from an object, handling both naming conventions
 */
export function getTier(item: any): string | number {
	const tier = normalizeProperty<string | number>(item, 'tier', 'Tier');
	return tier;
}

/**
 * Get source value from an object, handling both naming conventions
 */
export function getSource(item: any): string {
	const source = normalizeProperty<string>(item, 'source', 'Source');
	return source || 'core';
}

/**
 * Filter items by tier
 * @param items - Array of items to filter
 * @param tier - Tier to filter by (string or number)
 * @returns Filtered array of items matching the tier
 */
export function filterByTier<T>(items: T[], tier: string | number): T[] {
	const targetTier = tier.toString();
	return items.filter(item => {
		const itemTier = getTier(item);
		return itemTier?.toString() === targetTier;
	});
}

/**
 * Filter items by source
 * @param items - Array of items to filter
 * @param source - Source to filter by (e.g., 'core', 'custom', 'umbra')
 * @returns Filtered array of items matching the source
 */
export function filterBySource<T>(items: T[], source: string): T[] {
	return items.filter(item => {
		const itemSource = getSource(item);
		return itemSource.toLowerCase() === source.toLowerCase();
	});
}

/**
 * Filter items by multiple criteria
 * @param items - Array of items to filter
 * @param criteria - Object containing tier and/or source filters
 * @returns Filtered array of items
 */
export function filterByMultipleCriteria<T>(
	items: T[],
	criteria: { tier?: string | number; source?: string }
): T[] {
	let filtered = items;

	if (criteria.tier !== undefined) {
		filtered = filterByTier(filtered, criteria.tier);
	}

	if (criteria.source !== undefined) {
		filtered = filterBySource(filtered, criteria.source);
	}

	return filtered;
}
