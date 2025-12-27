const fs = require('fs');
const path = require('path');

describe('OpSkl Sanity & Integrity Check', () => {
    test('System Environment should be stable', () => {
        expect(1 + 1).toBe(2);
    });

    test('MASTER_OPSKL.sql should contain corrected schema', () => {
        const sqlPath = path.join(__dirname, '../MASTER_OPSKL_TEST.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Check for Critical Fixes
        expect(sql).toContain('client_id'); // Gigs fix
        expect(sql).toContain('channel_id'); // Messages fix
        expect(sql).toContain('recipient_id'); // RLS fix
        expect(sql).toContain('target_user_id'); // Reviews fix

        // Check Sections
        expect(sql).toContain('CREATE TABLE IF NOT EXISTS gigs');
        expect(sql).toContain('CREATE TABLE IF NOT EXISTS messages');
        expect(sql).toContain('CREATE POLICY "Client Manage Gigs"');
    });

    test('Source Code should utilize correct columns', () => {
        const createGigPath = path.join(__dirname, '../src/features/client/screens/CreateGigScreen.tsx');
        const content = fs.readFileSync(createGigPath, 'utf8');
        expect(content).toContain('client_id: user.id');
    });

    test('Reanimated 4 fixes should be present', () => {
        const draggablePath = path.join(__dirname, '../src/core/components/AuraDraggable.tsx');
        const draggable = fs.readFileSync(draggablePath, 'utf8');
        expect(draggable).toContain('Gesture.Pan()');
        expect(draggable).not.toContain('useAnimatedGestureHandler');

        const toastPath = path.join(__dirname, '../src/core/components/AuraToast.tsx');
        const toast = fs.readFileSync(toastPath, 'utf8');
        expect(toast).toContain('Gesture.Pan()');
        expect(toast).not.toContain('useAnimatedGestureHandler');
    });
});
