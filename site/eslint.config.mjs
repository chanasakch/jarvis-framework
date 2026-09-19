import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [".next/**", "out/**", "content/generated/**", "public/**", "playwright-report/**"],
  },
  {
    rules: {
      // Raw hex/px values belong in the token layer (app/globals.css), not components.
      // This catches the common case; the S2 acceptance check greps the whole tree too.
      "no-restricted-syntax": [
        "warn",
        {
          selector: "Literal[value=/^#[0-9a-fA-F]{3,8}$/]",
          message: "Use a design token (CSS variable / Tailwind class), not a hard-coded hex color.",
        },
      ],
    },
  },
];

export default eslintConfig;
