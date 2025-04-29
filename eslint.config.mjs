import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import { defineConfig } from "eslint/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default defineConfig([
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
]);