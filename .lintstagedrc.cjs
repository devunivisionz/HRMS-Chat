/** @type {import('lint-staged').Config} */
module.exports = {
  // Format all supported files
  '*.{ts,tsx,js,cjs,mjs,json,md,yaml,yml}': ['prettier --write'],

  // Lint TypeScript/JavaScript
  '*.{ts,tsx}': ['eslint --fix --max-warnings 0'],

  // Type check changed files' packages
  '**/*.{ts,tsx}': () => 'pnpm typecheck',
};
