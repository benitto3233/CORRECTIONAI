module.exports = {
  preset: 'react-scripts',
  testEnvironment: 'jsdom',
  testMatch: ['**/tests/**/*.test.jsx'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!src/reportWebVitals.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  setupFilesAfterEnv: ['./tests/setup.js']
};
