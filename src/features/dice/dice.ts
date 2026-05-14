export type DicePart = { value: number; isModifier: boolean };

export function rollDice(expression: string): { total: number; parts: DicePart[] } {
    const tokens = expression.replace(/\s/g, "").split(/(?=[+-])/);
    let total = 0;
    const parts: DicePart[] = [];

    for (const token of tokens) {
        if (!token) continue;
        const sign = token.startsWith("-") ? -1 : 1;
        const raw = token.replace(/^[+-]/, "");

        const match = raw.match(/^(\d*)d(\d+)$/i);
        if (match) {
            const count = parseInt(match[1]) || 1;
            const sides = parseInt(match[2]);
            for (let i = 0; i < count; i++) {
                const roll = Math.floor(Math.random() * sides) + 1;
                const value = sign * roll;
                total += value;
                parts.push({ value, isModifier: false });
            }
        } else {
            const num = parseInt(raw);
            if (!isNaN(num)) {
                const value = sign * num;
                total += value;
                parts.push({ value, isModifier: true });
            }
        }
    }

    return { total, parts };
}
