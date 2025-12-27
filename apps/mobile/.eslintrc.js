module.exports = {
    root: true,
    extends: '@react-native',
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint', 'unused-imports'],
    overrides: [
        {
            files: ['*.ts', '*.tsx'],
            rules: {
                '@typescript-eslint/no-shadow': ['error'],
                'no-shadow': 'off',
                'no-undef': 'off',
                'react-native/no-inline-styles': 0,
                'prettier/prettier': 0, // Disable formatting rules for audit
                '@typescript-eslint/no-unused-vars': 'off',
                'unused-imports/no-unused-imports': 'error',
                'unused-imports/no-unused-vars': [
                    'warn',
                    { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' }
                ],
                'react/no-unstable-nested-components': 'off',
                'no-alert': 'off'
            },
        },
    ],
};
