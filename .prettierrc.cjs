/** @type {import('prettier').Config} */
module.exports = {
  semi:           true,
  singleQuote:    true,
  trailingComma:  'es5',
  printWidth:     100,
  tabWidth:       2,
  useTabs:        false,
  bracketSpacing: true,
  arrowParens:    'always',
  endOfLine:      'lf',
  plugins: ['prettier-plugin-tailwindcss'],
  // Tailwind plugin config
  tailwindConfig: './apps/web/tailwind.config.js',
  tailwindFunctions: ['cn', 'cva', 'clsx'],
};
