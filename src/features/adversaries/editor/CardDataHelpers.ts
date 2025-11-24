import { CardData } from "../../../types/index";

export function extractCardData(cardElement: HTMLElement): CardData {
    const statsText = cardElement.querySelector('.df-stats')?.textContent || '';
    
    const weaponRange = cardElement.getAttribute('data-weapon-range') || '';
    const type = cardElement.getAttribute('data-type') || '';

    const adversaryCount = cardElement.querySelectorAll('.df-hp-tickboxes').length;
    const count = adversaryCount > 0 ? adversaryCount.toString() : '1';

    return {
        id: cardElement.getAttribute('data-id') || '',
        name: cardElement.querySelector('h2')?.textContent?.trim() || '',
        tier: cardElement.querySelector('.df-subtitle')?.textContent?.match(/Tier (\d+)/)?.[1]?.trim() || '1',
        type: type || cardElement.querySelector('.df-subtitle')?.textContent?.split(/\s+/)[3]?.trim() || 'Standard',
        desc: cardElement.querySelector('.df-desc')?.textContent?.trim() || '',
        motives: cardElement.querySelector('.df-motives-desc')?.textContent?.trim() || '',
        difficulty: statsText.match(/Difficulty: ([^|]+)/)?.[1]?.trim() || '',
        thresholdMajor: statsText.match(/Thresholds: ([^/]+)/)?.[1]?.trim() || '',
        thresholdSevere: statsText.match(/Thresholds: [^/]+\/([^|]+)/)?.[1]?.trim() || '',
        hp: statsText.match(/HP: ([^|]+)/)?.[1]?.trim() || '',
        stress: statsText.match(/Stress: ([^|A]+|A(?!TK:))/)?.[1]?.trim() || '',
        atk: statsText.match(/ATK: ([^|]+)/)?.[1]?.trim() || '',
        weaponName: (() => {
            const match = statsText.match(/ATK[:\s]*[^|]*\|\s*([^:]+):/);
            if (!match) return '';
            
            return match[1].trim();
        })(),
        weaponRange: weaponRange,
        weaponDamage: (() => {
            const parts = statsText.split('|');
            const last = parts[parts.length - 1] || '';
            return last.replace(/Experience:.*/i, '').trim();
        })(),
        xp: cardElement.querySelector('.df-experience-line')?.textContent?.replace('Experience:', '')?.trim() || '',
        count: count,
        features: Array.from(cardElement.querySelectorAll('.df-feature')).map(feat => ({
            name: feat.querySelector('.df-feature-title')?.textContent?.split(' - ')[0]?.trim() || '',
            type: feat.querySelector('.df-feature-title')?.textContent?.split(' - ')[1]?.split(':')[0]?.trim() || '',
            cost: feat.querySelector('.df-feature-title')?.textContent?.includes(':')
                ? feat.querySelector('.df-feature-title')?.textContent?.split(':')[1]?.trim() || ''
                : '',
            desc: feat.querySelector('.df-feature-desc')?.textContent?.trim() || ''
        }))
    };
}
