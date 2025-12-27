module.exports = {
    // preset: 'jest-expo', // Disable strict Expo preset
    preset: 'react-native', // Use standard RN preset
    testEnvironment: 'node', // Force Node environment for speed and stability
    transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-reanimated|react-native-worklets-core)'
    ],
    setupFilesAfterEnv: ['<rootDir>/jest-setup.js']
};
