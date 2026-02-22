import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import tsEslintPlugin from "@typescript-eslint/eslint-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "**/*.d.ts"
    ],
    plugins: {
      '@typescript-eslint': tsEslintPlugin,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'react-hooks/exhaustive-deps': 'warn',
      '@next/next/no-img-element': 'off',

      // Enforce absolute imports - keine relativen Imports erlauben
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['../*', '../../*', '../../../*'],
            message: 'Verwende absolute Imports mit @/ anstelle von relativen Imports (../).'
          },
          {
            group: ['**/archive/**', '**/*.deprecated', '**/*.deprecated.*'],
            message: 'Importiere keine Dateien aus /archive oder *.deprecated (nur Referenz).'
          }
        ]
      }]
    }
  },
];

export default eslintConfig;
