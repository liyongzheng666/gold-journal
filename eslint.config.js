export default [
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  {
    files: ["src/**/*.{js,jsx}", "vite.config.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        console: "readonly",
        document: "readonly",
        window: "readonly",
        Intl: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        process: "readonly",
      },
    },
    rules: {
      "no-undef": "error",
      "no-unused-vars": [
        "error",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^[A-Z]",
        },
      ],
      "no-unreachable": "error",
    },
  },
];
