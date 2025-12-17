module.exports = {
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.jest.json'
    }
  },
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js'],
  transform: { '^.+\\.ts$': 'ts-jest' },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: [
    "<rootDir>/project-full-preview/",
    "<rootDir>/vendor/",
    "<rootDir>/tests/e2e/",
    "\\.int\\.test\\.ts$",
  ],
  globalTeardown: "<rootDir>/jest.globalTeardown.cjs",
};
