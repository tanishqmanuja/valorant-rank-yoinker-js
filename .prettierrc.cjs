/** @type {import('prettier').Options} */
module.exports = {
  arrowParens: "avoid",
  printWidth: 80,
  singleQuote: false,
  semi: true,
  tabWidth: 2,
  useTabs: false,
  importOrder: ["^~/(.*)$", "^[./]"],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  plugins: ["@trivago/prettier-plugin-sort-imports"],
};
