// eslint.config.js
import obsidianmd from "eslint-plugin-obsidianmd";
import tseslint from "typescript-eslint";

export default [
        ...obsidianmd.configs.recommended,
        {
                languageOptions: {
                        parserOptions: {
                                project: "./tsconfig.json",
                        },
                },
        },
];
