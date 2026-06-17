/** @type {import("eslint").Linter.Config} */
module.exports = {
  ...require('./base'),
  rules: {
    ...require('./base').rules,
    '@typescript-eslint/no-explicit-any': 'error',
    'no-restricted-syntax': [
      'error',
      {
        selector: 'CallExpression[callee.object.name="console"][callee.property.name!=/^(warn|error)$/]',
        message:  'Use the logger utility instead of console.log.',
      },
    ],
  },
}
