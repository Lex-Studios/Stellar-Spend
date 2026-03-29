import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Points to Next.js app root — loads next.config.ts and .env files
  dir: './',
});

const config: Config = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Only pick up *.jest.test.{ts,tsx} files — keeps vitest suite untouched
  testMatch: ['<rootDir>/src/**/*.jest.test.{ts,tsx}'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' } }],
  },
};

export default createJestConfig(config);
