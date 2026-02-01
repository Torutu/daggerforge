module.exports = {
	testEnvironment: 'node',
	testMatch: ['**/src/tests/**/*.test.ts'],
	moduleFileExtensions: ['ts', 'js', 'json'],
	transform: {
		'^.+\\.ts$': ['ts-jest', {
			tsconfig: 'tsconfig.test.json',
		}],
	},
	moduleNameMapper: {
		// Rewrite .js extensions back to .ts so Jest resolves source files
		'^(\\.{1,2}/.*)\\.js$': '$1',
		// Point all 'obsidian' imports at our stub — the real package only
		// exists inside the Obsidian Electron process
		'^obsidian$': '<rootDir>/src/tests/__mocks__/obsidian.ts',
	},
};