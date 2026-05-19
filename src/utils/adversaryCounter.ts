const MAX = 99;
let adversaryCount = 1;

export function getAdversaryCount(): number {
	return adversaryCount;
}

export function incrementAdversaryCount(difference: number): void {
	adversaryCount = Math.min(adversaryCount + difference, MAX);
}

export function decrementAdversaryCount(): void {
	if (adversaryCount > 1) adversaryCount--;
}

export function setAdversaryCount(count: number): void {
	if (count > 0) adversaryCount = Math.min(count, MAX);
}

export function resetAdversaryCount(): void {
	adversaryCount = 1;
}
