import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // A Node `-r`/`--require` preload hook (see scripts/build-legends.ts's
    // package.json script) — must stay CommonJS, so require() here is
    // correct, not a style violation. `parent`/`isMain` are unused directly
    // but required to match Module._load's signature for `arguments`.
    files: ["scripts/stub-server-only.cjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
]);

export default eslintConfig;
