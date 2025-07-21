// eslint.config.js
import obsidianmd from "eslint-plugin-obsidianmd";

export default [
  ...obsidianmd.configs.recommended,
  {
    rules: {
      // Example: customize or add rules
      "obsidianmd/prefer-file-manager-trash": "error",
      // You can also turn off a rule if you don’t want it
      "obsidianmd/sample-names": "off",
    },
  },
];
