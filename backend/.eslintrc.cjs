module.exports = {
  root: true,
  env: { node: true, es2022: true, jest: true },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  ignorePatterns: [
    'node_modules/**',
    'coverage/**',
    'dist/**',
    '__tests__/**/fixtures/**',
  ],
  rules: {
    'no-undef': 'error',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-unreachable': 'error',
    'no-constant-condition': ['error', { checkLoops: false }],
    'no-async-promise-executor': 'warn',
    'prefer-const': 'warn',
    'no-prototype-builtins': 'off',
    'no-useless-escape': 'warn',
  },
}
