import { CardData } from "@/types";

export function extractCardData(cardElement: HTMLElement): CardData {
    const statsText = cardElement.querySelector('.stats')?.textContent || '';
    
    // Extract dropdown values from data attributes
    const weaponRange = cardElement.getAttribute('data-weapon-range') || '';
    const type = cardElement.getAttribute('data-type') || '';

    // Count the number of adversary instances (HP tickbox containers)
    const adversaryCount = cardElement.querySelectorAll('.hp-tickboxes').length;
    const count = adversaryCount > 0 ? adversaryCount.toString() : '1';

    return {
        name: cardElement.querySelector('h2')?.textContent?.trim() || '',
        tier: cardElement.querySelector('.subtitle')?.textContent?.match(/Tier (\d+)/)?.[1]?.trim() || '1',
        type: type || cardElement.querySelector('.subtitle')?.textContent?.split(/\s+/)[3]?.trim() || 'Standard',
        desc: cardElement.querySelector('.desc')?.textContent?.trim() || '',
        motives: cardElement.querySelector('.motives-desc')?.textContent?.trim() || '',
        difficulty: statsText.match(/Difficulty: ([^|]+)/)?.[1]?.trim() || '',
        thresholdMajor: statsText.match(/Thresholds: ([^/]+)/)?.[1]?.trim() || '',
        thresholdSevere: statsText.match(/Thresholds: [^/]+\/([^|]+)/)?.[1]?.trim() || '',
        hp: statsText.match(/HP: ([^|]+)/)?.[1]?.trim() || '',
        stress: statsText.match(/Stress: ([^|A]+|A(?!TK:))/)?.[1]?.trim() || '',
        atk: statsText.match(/ATK: ([^|]+)/)?.[1]?.trim() || '',
        weaponName: (() => {
            // Match various ATK patterns followed by pipe and weapon name
            const match = statsText.match(/ATK[:\s]*[^|]*\|\s*([^:]+):/);
            if (!match) return '';
            
            // Extract and clean the weapon name (remove any leading/trailing whitespace)
            return match[1].trim();
        })(),
        weaponRange: weaponRange,
        weaponDamage: (() => {
            const parts = statsText.split('|');
            const last = parts[parts.length - 1] || '';
            return last.replace(/Experience:.*/i, '').trim();
        })(),
        xp: cardElement.querySelector('.experience-line')?.textContent?.replace('Experience:', '')?.trim() || '',
        count: count, // Add the count here
        features: Array.from(cardElement.querySelectorAll('.feature')).map(feat => ({
            name: feat.querySelector('.feature-title')?.textContent?.split(' - ')[0]?.trim() || '',
            type: feat.querySelector('.feature-title')?.textContent?.split(' - ')[1]?.split(':')[0]?.trim() || '',
            cost: feat.querySelector('.feature-title')?.textContent?.includes(':')
                ? feat.querySelector('.feature-title')?.textContent?.split(':')[1]?.trim() || ''
                : '',
            desc: feat.querySelector('.feature-desc')?.textContent?.trim() || ''
        }))
    };
}