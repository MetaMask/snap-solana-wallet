module.exports = {
  preset: '@metamask/snaps-jest',
  transform: {
    '^.+\\.(t|j)sx?$': 'ts-jest',
    '^.+\\.svg$': '<rootDir>/svg-transformer.js',
  },
  verbose: true,
  collectCoverage: true,
  setupFilesAfterEnv: ['./jest.setup.ts'],
  coverageReporters: ['html', 'json-summary', 'text', 'lcov'],
};
