// commitlint.config.js
// Enforces Conventional Commits format as documented in CONTRIBUTING.md.
// See: https://www.conventionalcommits.org/

/** @type {import('@commitlint/types').UserConfig} */
const config = {
  extends: ['@commitlint/config-conventional'],

  rules: {
    // Allow all conventional-commits types PLUS the project-specific ones
    // documented in CONTRIBUTING.md (contract, ci).
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'test',
        'chore',
        'ci',
        'perf',
        'contract', // Soroban smart contract changes
        'revert',
      ],
    ],

    // Subject line: max 100 chars, lower-case start is conventional but not enforced
    // to allow proper-nouns (Soroban, Allbridge, etc.)
    'subject-max-length': [2, 'always', 100],
    'subject-case': [0], // disabled — allow mixed-case subjects

    // Body / footer line length
    'body-max-line-length': [2, 'always', 120],
    'footer-max-line-length': [2, 'always', 120],
  },
};

module.exports = config;
