// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'
// @ts-ignore
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'

const tsRules = {
  '@typescript-eslint/semi': [2, 'never'],
  'quotes': 'off',
  '@typescript-eslint/quotes': ['error', 'single'],
  'space-before-function-paren': 'off',
  '@typescript-eslint/space-before-function-paren': ['error', 'always'],
  'no-irregular-whitespace': ['error'],
  'indent': 'off',
  '@typescript-eslint/indent': [
    'error',
    2,
    {
      SwitchCase: 1,
      flatTernaryExpressions: false,
      ignoredNodes: ['TSTypeParameterInstantiation'],
    },
  ],
  'no-multiple-empty-lines': ['error', { max: 1 }],
  'one-var': ['error', 'never'],
  'no-cond-assign': ['error', 'except-parens'],
  'comma-dangle': ['error', 'always-multiline'],
  'eqeqeq': ['error', 'always'],
  'eol-last': ['error', 'always'],
  'new-parens': ['error', 'always'],
  'no-caller': ['error'],
  'no-constant-condition': ['error'],
  'no-control-regex': ['error'],
  'no-debugger': ['error'],
  'no-duplicate-case': ['error'],
  'no-eval': ['error'],
  'no-ex-assign': ['error'],
  'no-extra-boolean-cast': ['error'],
  'no-fallthrough': ['error'],
  'no-inner-declarations': ['error'],
  'no-invalid-regexp': ['error', { allowConstructorFlags: ['u', 'y'] }],
  'no-unused-labels': ['error'],
  'no-proto': ['error'],
  'no-regex-spaces': ['error'],
  'no-self-compare': ['error'],
  'no-sparse-arrays': ['error'],
  'no-mixed-spaces-and-tabs': ['error'],
  'no-negated-in-lhs': ['error'],
  'no-new-wrappers': ['error'],
  'no-self-assign': ['error'],
  'no-this-before-super': ['error'],
  'no-with': ['error'],
  'rest-spread-spacing': ['error', 'never'],
  'no-trailing-spaces': ['error', { ignoreComments: true }],
  'no-undef-init': ['error'],
  'no-unsafe-finally': ['error'],
  'padded-blocks': ['error', 'never'],
  'space-in-parens': ['error', 'never'],
  'use-isnan': ['error'],
  'valid-typeof': ['error', { requireStringLiterals: true }],
  'brace-style': ['error', '1tbs'],
  'curly': ['error', 'all'],
  'no-return-await': ['off'],
  '@typescript-eslint/naming-convention': [
    'error',
    {
      selector: 'variable',
      format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
    },
    {
      selector: 'typeLike',
      format: ['PascalCase'],
    },
    {
      selector: 'class',
      format: ['PascalCase'],
    },
    {
      selector: 'interface',
      format: ['PascalCase'],
      custom: {
        regex: '^I[A-Z]',
        match: false,
      },
    },
  ],
  'handle-callback-err': ['error', '^(err|error)$'],
  'max-len': [
    'error',
    {
      code: 120,
      comments: 120,
      ignoreUrls: true,
      ignoreTemplateLiterals: true,
    },
  ],
  '@typescript-eslint/explicit-function-return-type': 'off',
  'no-array-constructor': ['error'],
  'no-unreachable': ['error'],
  'no-multi-spaces': ['error'],
  'no-unused-vars': ['error', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
}

export default withNuxt([
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true,
        sourceType: 'module',
        warnOnUnsupportedTypeScriptVersion: false,
      },
    },
    rules: tsRules,
    files: ['**/*.ts'],
  },
  {
    // disable type-aware linting on JS files
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    ignores: ['**/rollup.config.mjs'],
    ...tseslint.configs.disableTypeChecked,
  },
  eslintPluginPrettierRecommended,
  eslint.configs.recommended,
])
