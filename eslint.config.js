// eslint.config.js
import obsidianmd from "eslint-plugin-obsidianmd";
import tseslint from "typescript-eslint";
import globals from "globals";

export default [
	{
		ignores: ["main.js", "dist/**", "dist-test/**", "data.json"],
	},
	...obsidianmd.configs.recommended,
	{
		languageOptions: {
			parserOptions: {
				project: [
					"./tsconfig.json",
					"./tsconfig.test.json",
					"./character-codec/tsconfig.json",
				],
			},
		},
	},
	{
		// Root-level tooling/config scripts aren't part of any tsconfig project -
		// they're build/config scripts, not shipped plugin source - so they get
		// Node globals instead of the browser/DOM ones the plugin source uses.
		files: ["eslint.config.js", "esbuild.config.mjs", "jest.config.cjs", "version-bump.mjs"],
		languageOptions: {
			globals: globals.node,
		},
	},
	{
		// Same files - kept as a separate config object because spreading
		// disableTypeChecked's own languageOptions into the object above would
		// clobber the globals set there instead of merging with them.
		files: ["eslint.config.js", "esbuild.config.mjs", "jest.config.cjs", "version-bump.mjs"],
		...tseslint.configs.disableTypeChecked,
	},
	{
		// esbuild.config.mjs and version-bump.mjs are Node build/release
		// tooling that runs under plain Node (via `npm run build`/`version`),
		// never bundled into the shipped plugin - obsidian's "no Node.js
		// modules" mobile-compatibility rule doesn't apply to them.
		files: ["esbuild.config.mjs", "version-bump.mjs"],
		rules: {
			"obsidianmd/no-nodejs-modules": "off",
		},
	},
	{
		// Jest test files use describe/it/expect/... as globals.
		files: ["src/tests/**/*.ts"],
		languageOptions: {
			globals: globals.jest,
		},
	},
];
