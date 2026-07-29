/**
 * Unit tests for the deterministic on-device pipeline only (pure TS
 * services — ruleset, fingerprints). UI/RN components are not covered here.
 */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};
