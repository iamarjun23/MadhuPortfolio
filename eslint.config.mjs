import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "src/generated/**",
      "*.tsbuildinfo",
      ".open-next/**",
      ".wrangler/**",
      "cloudflare-env.d.ts",
    ],
  },
  ...nextVitals,
  ...nextTypescript,
  {
    // eslint-plugin-react's "detect" calls context.getFilename(), which ESLint 10 removed.
    settings: { react: { version: "19" } },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
];

export default eslintConfig;
