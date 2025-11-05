// Adversary counter state management
let adversaryCount = 1;

export function getAdversaryCount(): number {
	return adversaryCount;
}

export function incrementAdversaryCount(): void {
	adversaryCount++;
}

export function decrementAdversaryCount(): void {
	if (adversaryCount > 1) {
		adversaryCount--;
	}
}

export function setAdversaryCount(count: number): void {
	if (count > 0) {
		adversaryCount = count;
	}
}

export function resetAdversaryCount(): void {
	adversaryCount = 1;
}
