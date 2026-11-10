module.exports = {
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/jest.polyfills.cjs'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testRegex: 'src/.*\\.test\\.jsx?$',
  moduleNameMapper: { '\\.(css|svg)$': '<rootDir>/src/test/styleMock.js' },
};
