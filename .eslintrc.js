module.exports = {
  extends: ['next/core-web-vitals'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_' 
    }],
    '@typescript-eslint/no-empty-interface': ['error', {
      allowSingleExtends: true
    }]
  },
  overrides: [
    {
      // Disable no-explicit-any for specific files
      files: ['src/app/dashboard/client/calls/page.tsx'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off'
      }
    }
  ]
}; 