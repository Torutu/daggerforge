// dice.ts
export function rollDice(expression: string): { total: number; details: string } {
    const parts = expression.split("+").map(p => p.trim());
    let total = 0;
    const allRolls: number[] = [];

    for (const part of parts) {
        const match = part.match(/(\d*)d(\d+)/i);
        if (match) {
            const count = parseInt(match[1]) || 1;
            const sides = parseInt(match[2]);

            for (let i = 0; i < count; i++) {
                const roll = Math.floor(Math.random() * sides) + 1;
                allRolls.push(roll);
                total += roll;
            }
        } else {
            // Flat number
            const num = parseInt(part);
            if (!isNaN(num)) {
                allRolls.push(num);
                total += num;
            }
        }
    }

    return { total, details: `[${allRolls.join(", ")}]` };
}
