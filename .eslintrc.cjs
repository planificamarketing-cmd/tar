/** ESLint base compartido del monorepo. Reglas sin type-checking para mantener el CI rápido. */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  env: { node: true, es2022: true },
  ignorePatterns: [
    'node_modules',
    'dist',
    '.next',
    'coverage',
    '*.config.*',
    'next-env.d.ts',
  ],
  rules: {
    // §6 CLAUDE.md: cero `any` sin justificar → warn para no bloquear, revisar en PR.
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
  },
};
