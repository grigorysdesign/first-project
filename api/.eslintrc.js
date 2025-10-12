module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json",
    sourceType: "module"
  },
  plugins: ["@typescript-eslint"],
  extends: ["plugin:@typescript-eslint/recommended", "plugin:import/recommended", "plugin:import/typescript", "prettier"],
  root: true,
  ignorePatterns: [".eslintrc.js"],
  rules: {
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "import/order": [
      "warn",
      {
        "newlines-between": "always",
        "alphabetize": { order: "asc", caseInsensitive: true }
      }
    ]
  }
};
