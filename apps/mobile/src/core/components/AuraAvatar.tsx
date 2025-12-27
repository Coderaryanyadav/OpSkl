import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { AuraColors } from '../theme/aura';

type AuraAvatarProps = {
    source?: string | { uri: string } | null;
    size?: number;
    hasStatus?: boolean;
    isOnline?: boolean;
    hasBorder?: boolean;
    borderColor?: string;
    style?: any;
};

export function AuraAvatar({
    source,
    size = 40,
    hasStatus = false,
    isOnline = false,
    hasBorder = false,
    borderColor = AuraColors.white,
    style
}: AuraAvatarProps) {
    const fallbackImage = `https://ui-avatars.com/api/?name=Talent&background=000000&color=ffffff&size=128`;

    let imageSource: any = { uri: fallbackImage };

    if (source) {
        if (typeof source === 'string') {
            if (source.startsWith('http') || source.startsWith('file')) {
                imageSource = { uri: source };
            }
        } else if (typeof source === 'object' && 'uri' in source) {
            imageSource = source;
        }
    }

    return (
        <View style={[styles.container, { width: size, height: size }, style]}>
            <Image
                source={imageSource}
                style={[
                    styles.image,
                    { width: size, height: size, borderRadius: size / 2 },
                    hasBorder && { borderWidth: 2, borderColor }
                ]}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
            />
            {hasStatus && (
                <View style={[
                    styles.statusDot,
                    {
                        backgroundColor: isOnline ? AuraColors.success : AuraColors.gray600,
                        borderWidth: 2,
                        borderColor: AuraColors.background,
                        width: size * 0.28,
                        height: size * 0.28,
                        borderRadius: (size * 0.28) / 2
                    }
                ]} />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    image: {
        backgroundColor: AuraColors.surfaceLight,
    },
    statusDot: {
        position: 'absolute',
        bottom: 2,
        right: 2,
    }
});
