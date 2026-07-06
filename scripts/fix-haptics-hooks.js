const fs = require('fs');
const path = require('path');

const files = [
    "apps/mobile/src/features/client/screens/ClientManageGigsScreen.tsx",
    "apps/mobile/src/features/client/screens/ClientProfileScreen.tsx",
    "apps/mobile/src/features/profile/screens/VerificationScreen.tsx",
    "apps/mobile/src/features/profile/screens/WalletScreen.tsx",
    "apps/mobile/src/features/profile/screens/NotificationsScreen.tsx",
    "apps/mobile/src/features/profile/screens/PublicProfileScreen.tsx",
    "apps/mobile/src/features/profile/screens/EditProfileScreen.tsx",
    "apps/mobile/src/features/profile/screens/ProfileScreen.tsx",
    "apps/mobile/src/features/auth/screens/OnboardingScreen.tsx",
    "apps/mobile/src/features/worker/screens/ReviewScreen.tsx",
    "apps/mobile/src/features/worker/screens/WorkerMyGigsScreen.tsx",
    "apps/mobile/src/features/worker/screens/TalentPerksScreen.tsx",
    "apps/mobile/src/features/worker/screens/DailyQuestsScreen.tsx",
    "apps/mobile/src/features/chat/screens/MessageListScreen.tsx",
    "apps/mobile/src/features/chat/screens/ChatScreen.tsx",
    "apps/mobile/src/core/components/AuraListItem.tsx",
    "apps/mobile/src/core/components/AuraSwitch.tsx",
    "apps/mobile/src/core/components/AuraDialog.tsx",
    "apps/mobile/src/core/components/LocationPicker.tsx",
    "apps/mobile/src/core/context/AuraProvider.tsx"
];

console.log("🔧 Starting intelligent hook injection...");

files.forEach(filePath => {
    const fullPath = path.resolve(process.cwd(), filePath);

    if (!fs.existsSync(fullPath)) {
        console.log(`❌ File not found: ${filePath}`);
        return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');

    // Only process if useAuraHaptics is imported but not used
    if (content.includes('useAuraHaptics') && !content.includes('const haptics = useAuraHaptics();')) {
        console.log(`Processing: ${filePath}`);

        // 1. Try to find standard Functional Component: export default function Name() {
        // We match stricter pattern to avoid matching inner functions if possible, but basic top level is usually first.
        let match = content.match(/export default function \w+\s*\(.*?\)\s*\{/);

        if (!match) {
            // 2. Try Arrow Function: const Name = () => {
            match = content.match(/const \w+\s*=\s*\(.*?\)\s*=>\s*\{/);
        }

        if (match) {
            const insertionPoint = match.index + match[0].length;
            const before = content.substring(0, insertionPoint);
            const after = content.substring(insertionPoint);

            // Check if it's already there (rare case of manual addition not detected by simple includes)
            if (!after.trim().startsWith('const haptics = useAuraHaptics();')) {
                const newContent = `${before}\n    const haptics = useAuraHaptics();${after}`;
                fs.writeFileSync(fullPath, newContent, 'utf8');
                console.log(`  ✅ Injected hook into ${filePath}`);
            }
        } else {
            console.log(`  ⚠️  Could not find component body in ${filePath}`);
        }
    } else {
        console.log(`  Skipping ${filePath} (Hook already present or not imported)`);
    }
});

console.log("✅ Hook injection complete.");
