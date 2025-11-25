let adversaryCount: number = 1;

export const incrementAdversaryCount = (amount: number = 1): void => {
	adversaryCount += amount;
};

export const decrementAdversaryCount = (amount: number = 1): void => {
	if (adversaryCount !== 1) adversaryCount -= amount;
};

export const getAdversaryCount = (): number => adversaryCount;

export const resetAdversaryCount = (): void => {
	adversaryCount = 0;
};
