const base = {
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.jest.json'
    }
  },
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  transform: { '^.+\\.(ts|tsx)$': 'ts-jest' },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ["<rootDir>/tests/setupTests.ts"],
  testPathIgnorePatterns: [
    "<rootDir>/project-full-preview/",
    "<rootDir>/vendor/",
    "<rootDir>/e2e/",
    "<rootDir>/tests/e2e/",
    "<rootDir>/playwright/",
    "\\.int\\.test\\.ts$",
  ],
  globalTeardown: "<rootDir>/jest.globalTeardown.cjs",
};

module.exports = [
  // Default project: node environment for non-UI tests
  Object.assign({}, base, {
    displayName: 'node',
    testEnvironment: 'node',
    testPathIgnorePatterns: (base.testPathIgnorePatterns || []).concat(["<rootDir>/src/components/"]),
  }),

  // UI project: run component tests under jsdom
  Object.assign({}, base, {
    displayName: 'jsdom',
    testEnvironment: 'jsdom',
    testMatch: ['<rootDir>/src/components/**/?(*.)+(spec|test).ts?(x)', '<rootDir>/tests/**/?(*.)+(spec|test).ts?(x)'],
  }),
];
module.exports = {
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.jest.json'
    }
  },
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  transform: { '^.+\\.(ts|tsx)$': 'ts-jest' },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ["<rootDir>/tests/setupTests.ts"],
  testPathIgnorePatterns: [
    "<rootDir>/project-full-preview/",
    "<rootDir>/vendor/",
    "<rootDir>/e2e/",
    "<rootDir>/tests/e2e/",
    "<rootDir>/playwright/",
    "\\.int\\.test\\.ts$",
  ],
  globalTeardown: "<rootDir>/jest.globalTeardown.cjs",
};
