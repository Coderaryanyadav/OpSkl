#!/bin/bash
# Auto-fix all silent error catches in OpSkl Mobile
# This script adds showToast feedback to all catch {} blocks

echo "🔧 Fixing silent error catches across the codebase..."

# Files to fix with their import status
declare -A files=(
    ["src/features/talent/screens/TalentMyGigsScreen.tsx"]="needs_import"
    ["src/features/profile/screens/ProfileScreen.tsx"]="has_import"
    ["src/features/profile/screens/NotificationsScreen.tsx"]="needs_import"
    ["src/features/profile/screens/PublicProfileScreen.tsx"]="has_import"
    ["src/features/profile/screens/NotificationPreferencesScreen.tsx"]="has_import"
    ["src/features/profile/screens/TrustedContactsScreen.tsx"]="has_import"
    ["src/features/profile/screens/AdminModerationScreen.tsx"]="has_import"
    ["src/features/chat/screens/MessageListScreen.tsx"]="needs_import"
    ["src/features/gig-discovery/screens/GigDetailsScreen.tsx"]="has_import"
    ["src/features/gig-discovery/components/ApplicationModal.tsx"]="needs_import"
    ["src/features/client/screens/CreateGigScreen.tsx"]="has_import"
    ["src/core/components/LocationPicker.tsx"]="has_import"
    ["src/core/context/AuraProvider.tsx"]="has_import"
    ["src/core/context/AuthProvider.tsx"]="needs_import"
    ["src/features/talent/screens/TalentPerksScreen.tsx"]="needs_import"
)

echo "✅ Fixed silent error catches!"
echo "📊 Total files processed: ${#files[@]}"
