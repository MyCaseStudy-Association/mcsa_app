/**
 * Unit tests for the deterministic on-device pipeline only (pure TS
 * services — ruleset, fingerprints). UI/RN components are not covered here.
 *
 * franc-min (language gate) and its deps ship ESM only; they are the one
 * node_modules exception transpiled to CommonJS for Jest. Pattern covers
 * pnpm's `.pnpm/<pkg>@<version>/` layout.
 */
const ESM_PACKAGES = "franc-min|trigram-utils|n-gram|collapse-white-space";

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": "ts-jest",
    "^.+\\.js$": ["ts-jest", { tsconfig: { allowJs: true } }],
  },
  transformIgnorePatterns: [
    `/node_modules/(?!(\\.pnpm/)?(${ESM_PACKAGES})[@/])`,
  ],
  testMatch: ["**/__tests__/**/*.test.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};
