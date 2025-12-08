// eslint.config.js - Configuração para React + Vite (Flat Config)

import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  {
    files: ["src/**/*.{js,jsx}"],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    plugins: {
      react,
      "react-hooks": reactHooks,
    },

    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,

      // Regras adicionais úteis
      "react/react-in-jsx-scope": "off", // Não é necessário no React 17+
      "react/prop-types": "off", // Opcional — desligado porque a maioria usa TS ou validações próprias

      // Regras de hooks
      ...reactHooks.configs.recommended.rules,

      // Boas práticas gerais
      "no-unused-vars": "warn",
      "no-undef": "error",
      "no-console": "warn",
    },

    settings: {
      react: {
        version: "detect",
      },
    },
  },
];
