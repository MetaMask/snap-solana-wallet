module.exports = {
  preset: '@metamask/snaps-jest',
  transform: {
    '^.+\\.(t|j)sx?$': 'ts-jest',
  },
  verbose: true,
  collectCoverage: true,
  setupFilesAfterEnv: ['./jest.setup.ts'],
  coverageReporters: ['html', 'json-summary', 'text'],
  moduleNameMapper: {
    '^.+.(svg)$': 'jest-transform-stub',
  },
};
