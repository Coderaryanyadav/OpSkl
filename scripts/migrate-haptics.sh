#!/bin/bash
# 🚀 BATCH HAPTICS MIGRATION SCRIPT
# Replaces all direct Expo Haptics calls with useAuraHaptics hook

set -e

FILES=(
  "apps/mobile/src/features/client/screens/ClientManageGigsScreen.tsx"
  "apps/mobile/src/features/client/screens/CreateGigScreen.tsx"
  "apps/mobile/src/features/client/screens/ClientProfileScreen.tsx"
  "apps/mobile/src/features/profile/screens/VerificationScreen.tsx"
  "apps/mobile/src/features/profile/screens/WalletScreen.tsx"
  "apps/mobile/src/features/profile/screens/NotificationsScreen.tsx"
  "apps/mobile/src/features/profile/screens/PublicProfileScreen.tsx"
  "apps/mobile/src/features/profile/screens/EditProfileScreen.tsx"
  "apps/mobile/src/features/profile/screens/ProfileScreen.tsx"
  "apps/mobile/src/features/auth/screens/OnboardingScreen.tsx"
  "apps/mobile/src/features/worker/screens/ReviewScreen.tsx"
  "apps/mobile/src/features/worker/screens/WorkerMyGigsScreen.tsx"
  "apps/mobile/src/features/worker/screens/TalentPerksScreen.tsx"
  "apps/mobile/src/features/worker/screens/DailyQuestsScreen.tsx"
  "apps/mobile/src/features/chat/screens/MessageListScreen.tsx"
  "apps/mobile/src/features/chat/screens/ChatScreen.tsx"
  "apps/mobile/src/core/components/AuraListItem.tsx"
  "apps/mobile/src/core/components/AuraSwitch.tsx"
  "apps/mobile/src/core/components/AuraDialog.tsx"
  "apps/mobile/src/core/components/LocationPicker.tsx"
  "apps/mobile/src/core/context/AuraProvider.tsx"
  "apps/mobile/src/core/services/safety.ts"
)

echo "🔧 Starting batch haptics migration..."

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✓ Processing: $file"
    
    # Remove old Haptics import
    sed -i '' '/import \* as Haptics from/d' "$file"
    
    # Add useAuraHaptics import if not present
    if ! grep -q "useAuraHaptics" "$file"; then
      # Find the last import line and add after it
      sed -i '' '/^import.*from/a\
import { useAuraHaptics } from '\''@core/hooks/useAuraHaptics'\'';
' "$file"
    fi
    
    # Replace Haptics calls (basic patterns)
    sed -i '' 's/Haptics\.impactAsync(Haptics\.ImpactFeedbackStyle\.Light)/haptics.light()/g' "$file"
    sed -i '' 's/Haptics\.impactAsync(Haptics\.ImpactFeedbackStyle\.Medium)/haptics.medium()/g' "$file"
    sed -i '' 's/Haptics\.impactAsync(Haptics\.ImpactFeedbackStyle\.Heavy)/haptics.heavy()/g' "$file"
    sed -i '' 's/Haptics\.selectionAsync()/haptics.selection()/g' "$file"
    sed -i '' 's/Haptics\.notificationAsync(Haptics\.NotificationFeedbackType\.Success)/haptics.success()/g' "$file"
    sed -i '' 's/Haptics\.notificationAsync(Haptics\.NotificationFeedbackType\.Warning)/haptics.warning()/g' "$file"
    sed -i '' 's/Haptics\.notificationAsync(Haptics\.NotificationFeedbackType\.Error)/haptics.error()/g' "$file"
    
  else
    echo "  ✗ File not found: $file"
  fi
done

echo "✅ Batch migration complete!"
echo "⚠️  Manual review required for complex patterns."
