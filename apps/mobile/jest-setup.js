/* eslint-env jest */
// Mock Supabase
const createQueryBuilder = () => {
    const builder = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
            data: {
                id: 'test-id',
                tokens_balance: 100,
                wallet_balance_cents: 10000,
                total_gigs_completed: 10,
                full_name: 'Test User',
                xp: 1000,
                current_streak: 5,
                longest_streak: 10,
                average_rating: 4.8,
                tier: 1,
                total_xp: 500,
                level: 5,
                referral_code: 'ABCDEF',
                avatar_url: 'https://example.com/avatar.png'
            },
            error: null
        }),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        // Make the object thenable so it can be awaited
        then: (resolve) => resolve({
            data: [{
                id: 'test-data',
                tokens_balance: 100,
                wallet_balance_cents: 10000,
                total_gigs_completed: 10,
                full_name: 'Test User',
                xp: 1000,
                current_streak: 5,
                longest_streak: 10,
                average_rating: 4.8,
                tier: 1,
                total_xp: 500,
                level: 5,
                referral_code: 'ABCDEF',
                avatar_url: 'https://example.com/avatar.png'

            }],
            error: null
        })
    };
    return builder;
};

jest.mock('./src/core/api/supabase', () => ({
    supabase: {
        auth: {
            signUp: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null }),
            signInWithPassword: jest.fn().mockResolvedValue({ data: { session: {} }, error: null }),
            signOut: jest.fn().mockResolvedValue({ error: null }),
            resetPasswordForEmail: jest.fn().mockResolvedValue({ error: null }),
            getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } } }),
            getSession: jest.fn().mockResolvedValue({ data: { session: {} }, error: null }),
        },
        from: jest.fn(() => createQueryBuilder()),
        channel: jest.fn(() => ({
            on: jest.fn().mockReturnThis(),
            subscribe: jest.fn().mockImplementation((cb) => cb && cb('SUBSCRIBED')),
            unsubscribe: jest.fn(),
        })),
        rpc: jest.fn().mockResolvedValue({ data: {}, error: null }),
    },
}));

// Mock Reanimated
try {
    require('react-native-reanimated/lib/module/jestUtils').setUpTests();
} catch (e) {
    // Fallback or ignore if missing
    console.warn("Reanimated JestUtils not loaded", e.message);
}
global.__reanimatedWorkletInit = jest.fn();

// Mock Navigation
jest.mock('@react-navigation/native', () => ({
    useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
    useRoute: () => ({ params: {} }),
}));

// Mock Async Storage
jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
    addEventListener: jest.fn(),
    fetch: jest.fn().mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
    }),
    useNetInfo: jest.fn().mockReturnValue({
        isConnected: true,
        isInternetReachable: true,
    }),
}));

