// import { CardData } from "@/types";
// export function extractCardData(cardElement: HTMLElement): CardData {
//     const statsText = cardElement.querySelector('.stats')?.textContent || '';
    
//     return {
//         name: cardElement.querySelector('h2')?.textContent?.trim() || '',
//         tier: cardElement.querySelector('.subtitle')?.textContent?.match(/Tier (\d+)/)?.[1]?.trim() || '1',
//         type: cardElement.querySelector('.subtitle')?.textContent?.split(/\s+/)[3]?.trim() || 'Standard',
//         desc: cardElement.querySelector('.desc')?.textContent?.trim() || '',
//         motives: cardElement.querySelector('.motives-desc')?.textContent?.trim() || '',
//         difficulty: statsText.match(/Difficulty: ([^|]+)/)?.[1]?.trim() || '',
//         thresholdMajor: statsText.match(/Thresholds: ([^/]+)/)?.[1]?.trim() || '',
//         thresholdSevere: statsText.match(/Thresholds: [^/]+\/([^|]+)/)?.[1]?.trim() || '',
//         hp: statsText.match(/HP: ([^|]+)/)?.[1]?.trim() || '',
//         stress: statsText.match(/Stress: ([^|]+)/)?.[1]?.trim() || '',
//         atk: statsText.match(/ATK: ([^|]+)/)?.[1]?.trim() || '',
//         weaponName: statsText.match(/([^:]+):/)?.[1]?.trim() || '',
//         weaponRange: statsText.match(/: ([^|]+)/)?.[1]?.trim() || '',
//         weaponDamage: (() => {
//             const parts = statsText.split('|');
//             const last = parts[parts.length - 1] || '';
//             return last.replace(/Experience:.*/i, '').trim();
//          })(),
//         xp: cardElement.querySelector('.experience-line')?.textContent?.replace('Experience:', '')?.trim() || '',
//         features: Array.from(cardElement.querySelectorAll('.feature')).map(feat => ({
//             name: feat.querySelector('.feature-title')?.textContent?.split(' - ')[0]?.trim() || '',
//             type: feat.querySelector('.feature-title')?.textContent?.split(' - ')[1]?.split(':')[0]?.trim() || '',
//             cost: feat.querySelector('.feature-title')?.textContent?.includes(':') 
//                 ? feat.querySelector('.feature-title')?.textContent?.split(':')[1]?.trim() || ''
//                 : '',
//             desc: feat.querySelector('.feature-desc')?.textContent?.trim() || ''
//         }))
//     };
// }