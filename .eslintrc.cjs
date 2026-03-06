/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType:  'module',
    project:     true,
  },
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/strict-type-checked',
    'plugin:@typescript-eslint/stylistic-type-checked',
    'plugin:import/recommended',
    'plugin:import/typescript',
  ],
  rules: {
    // TypeScript — strict rules matching our conventions
    '@typescript-eslint/no-explicit-any':           'error',
    '@typescript-eslint/no-non-null-assertion':      'error',
    '@typescript-eslint/explicit-function-return-type': ['warn', {
      allowExpressions:        true,
      allowTypedFunctionExpressions: true,
    }],
    '@typescript-eslint/consistent-type-imports':   ['error', { prefer: 'type-imports' }],
    '@typescript-eslint/no-unused-vars':             ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-floating-promises':       'error',
    '@typescript-eslint/await-thenable':             'error',
    '@typescript-eslint/no-misused-promises':        'error',

    // Import ordering — matches our convention
    'import/order': ['error', {
      'groups': [
        'builtin',
        'external',
        ['internal', 'parent', 'sibling', 'index'],
        'type',
      ],
      'newlines-between': 'always',
      'alphabetize': { order: 'asc', caseInsensitive: true },
    }],
    'import/no-duplicates':    'error',
    'import/no-cycle':         'error',
    'import/no-self-import':   'error',

    // General
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'eqeqeq':    ['error', 'always'],
    'no-var':     'error',
    'prefer-const': 'error',
  },
  settings: {
    'import/resolver': {
      typescript: { alwaysTryTypes: true },
    },
  },
  ignorePatterns: [
    'node_modules/',
    '.next/',
    'dist/',
    '*.js',          // ignore compiled output
    'prisma/migrations/',
  ],
};
