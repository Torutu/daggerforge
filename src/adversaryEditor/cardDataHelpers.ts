export function extractCardData(cardElement: HTMLElement) {
    // Local helper function to safely extract text
    const getText = (selector: string, root?: HTMLElement | DocumentFragment): string => {
        const baseElement = root ?? cardElement;
        return baseElement.querySelector(selector)?.textContent?.trim() || '';
    };

    // Extract basic info
    const name = getText('h2');
    const subtitle = getText('.subtitle');
    const statsText = getText('.stats');
    
    // Parse tier and type from subtitle
    const tierMatch = subtitle.match(/Tier (\d+)/);
    const typeMatch = subtitle.split(/\s+/);
    
    // Parse stats with better regex patterns
    const parseStat = (regex: RegExp) => statsText.match(regex)?.[1]?.trim() || '';
    // When editing a card
    
    return {
        name: name,
        tier: tierMatch?.[1] || '1',
        type: typeMatch.length > 3 ? typeMatch[3] : 'Standard',
        desc: getText('.desc'),
        motives: getText('.motives-desc'),
        difficulty: parseStat(/Difficulty: ([^|]+)/),
        thresholdMajor: parseStat(/Major[^:]*: ([^|]+)/) || parseStat(/Thresholds: ([^/]+)/),
        thresholdSevere: parseStat(/Severe[^:]*: ([^|]+)/) || parseStat(/Thresholds: [^/]+\/([^|]+)/),
        hp: parseStat(/HP: ([^|]+)/),
        stress: parseStat(/Stress: ([^|]+)/),
        atk: parseStat(/ATK: ([^|]+)/),
        weaponName: parseStat(/([^:]+):/),
        weaponRange: parseStat(/: ([^|]+)/),
        weaponDamage: parseStat(/\| ([^<]+)/),
        xp: getText('.experience-line').replace('Experience:', '').trim(),
        features: Array.from(cardElement.querySelectorAll('.feature')).map(feat => {
            const title = getText('.feature-title', feat as HTMLElement);
            const [namePart, typeCostPart] = title.split(' - ');
            const [typePart, costPart] = typeCostPart?.split(':') || [];
            
            return {
                name: namePart || '',
                type: typePart?.trim() || '',
                cost: costPart?.trim() || '',
                desc: getText('.feature-desc', feat as HTMLElement)
            };
        })
    };
}