// Minimal ESLint config for the frontend. We rely on react/recommended
// + react-hooks + a small set of correctness rules. No stylistic nits.
module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  settings: { react: { version: 'detect' } },
  ignorePatterns: [
    'node_modules/**',
    'dist/**',
    'coverage/**',
    'e2e/**',
    'playwright.config.js',
    'vitest.config.js',
    'postcss.config.js',
    'tailwind.config.js',
    'vite.config.js',
  ],
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'react/prop-types': 'off',  // we're not declaring prop types
    'react/react-in-jsx-scope': 'off',  // React 18 + new JSX transform
    'react/no-unescaped-entities': 'off',  // noisy; modern browsers handle UTF-8 fine
    'react/jsx-no-undef': 'error',
    'no-undef': 'error',
    'no-useless-escape': 'off',
  },
}
