module.exports = {
	testEnvironment: 'node',
	verbose: true,
	testMatch: ['**/src/tests/**/*.test.ts'],
	// Polyfills Obsidian's HTMLElement extensions (createEl, empty, ...) for
	// test files that opt into jsdom via the @jest-environment pragma; a
	// no-op for files on the default 'node' environment.
	setupFilesAfterEnv: ['<rootDir>/src/tests/obsidianDomPolyfill.ts'],
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
	transform: {
		'^.+\\.(ts|tsx)$': ['ts-jest', {
			tsconfig: 'tsconfig.test.json',
		}],
	},
	moduleNameMapper: {
		// Rewrite .js extensions back to .ts so Jest resolves source files
		'^(\\.{1,2}/.*)\\.js$': '$1',
		// Point all 'obsidian' imports at our stub - the real package only
		// exists inside the Obsidian Electron process
		'^obsidian$': '<rootDir>/src/tests/__mocks__/obsidian.ts',
	},
};