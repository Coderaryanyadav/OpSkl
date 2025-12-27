import React, { useState } from 'react';
import { useAuraHaptics } from '@core/hooks/useAuraHaptics';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuraHeader } from '@core/components/AuraHeader';
import { AuraText } from '@core/components/AuraText';
import { AuraButton } from '@core/components/AuraButton';
import { AuraInput } from '@core/components/AuraInput';
import { AuraMotion } from '@core/components/AuraMotion';
import { AuraColors, AuraSpacing, AuraBorderRadius } from '@theme/aura';
import { useAura } from '@core/context/AuraProvider';
import { useAuth } from '@context/AuthProvider';
import { Repository } from '@api/repository';
import * as ImagePicker from 'expo-image-picker';
import { Upload, Plus, X, Image as ImageIcon } from 'lucide-react-native';

export default function PortfolioUploadScreen() {
    const haptics = useAuraHaptics();
    const navigation = useNavigation();
    const { showDialog, showToast } = useAura();
    const { user } = useAuth();

    // State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const pickImage = async () => {
        haptics.light();
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
                showToast({ message: "File too large (Max 5MB)", type: 'error' });
                return;
            }
            setImageUrl(asset.uri);
        }
    };

    const handleUpload = async () => {
        if (!title.trim() || !imageUrl) {
            haptics.error();
            showToast({ message: "Title and Image are required.", type: 'error' });
            return;
        }

        setUploading(true);
        haptics.heavy();

        try {
            if (!user) throw new Error("Authentication missing.");

            // In a real app we'd upload the image file to Supabase Storage first.
            // For this MVP, we will use the local URI or a placeholder if it's local.
            // WARNING: Local URIs won't work across devices. 
            // Ideally, we need a storage bucket. 
            // Assuming for now the ImagePicker URI is just passed or we mock the upload.

            // NOTE TO USER: This saves the URI. Production requires Supabase Storage implementation.

            const { error } = await Repository.addPortfolioItem({
                user_id: user.id,
                title,
                description,
                image_url: imageUrl, // TODO: Replace with Storage URL
                link_url: linkUrl || null
            });

            if (error) throw new Error(error.message);

            haptics.success();
            showToast({ message: "Portfolio Asset Securely Indexed", type: 'success' });
            navigation.goBack();

        } catch (error: any) {
            haptics.error();
            showToast({ message: error.message, type: 'error' });
        } finally {
            setUploading(false);
        }
    };

    return (
        <View style={styles.container}>
            <AuraHeader title="Upload Asset" showBack />

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <AuraMotion type="slide" style={styles.uploadSection}>
                    <TouchableOpacity onPress={pickImage} activeOpacity={0.8} style={styles.imageBox}>
                        {imageUrl ? (
                            <>
                                <Image source={{ uri: imageUrl }} style={styles.image} />
                                <TouchableOpacity
                                    style={styles.removeBtn}
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        setImageUrl(null);
                                        haptics.medium();
                                    }}
                                >
                                    <X size={16} color={AuraColors.white} />
                                </TouchableOpacity>
                            </>
                        ) : (
                            <View style={styles.placeholder}>
                                <View style={styles.iconCircle}>
                                    <Upload size={24} color={AuraColors.primary} />
                                </View>
                                <AuraText variant="bodyBold" style={{ marginTop: 16 }}>Select Visual Asset</AuraText>
                                <AuraText variant="caption" color={AuraColors.gray500}>16:9 Aspect Ratio • Max 5MB</AuraText>
                            </View>
                        )}
                    </TouchableOpacity>
                </AuraMotion>

                <AuraMotion type="slide" delay={100} style={styles.form}>
                    <AuraInput
                        label="Project Designation"
                        value={title}
                        onChangeText={setTitle}
                        placeholder="e.g. Neon Interface V4"
                        leftIcon={<ImageIcon size={18} color={AuraColors.gray400} />}
                    />

                    <AuraInput
                        label="Asset Description"
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Technical briefing of the work..."
                        multiline
                        style={{ height: 120 }}
                    />

                    <AuraInput
                        label="External Link (Optional)"
                        value={linkUrl}
                        onChangeText={setLinkUrl}
                        placeholder="https://behance.net/..."
                        leftIcon={<Upload size={18} color={AuraColors.gray400} />}
                    />
                </AuraMotion>

                <AuraMotion type="slide" delay={200} style={styles.footer}>
                    <AuraButton
                        title={uploading ? "UPLOADING..." : "PUBLISH TO PROFILE"}
                        onPress={handleUpload}
                        disabled={uploading}
                        style={styles.submitBtn}
                        icon={<Plus size={18} color={AuraColors.black} />}
                    />
                </AuraMotion>

                <View style={{ height: 60 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AuraColors.background,
    },
    content: {
        padding: AuraSpacing.xl,
    },
    uploadSection: {
        marginBottom: 32,
    },
    imageBox: {
        height: 220,
        backgroundColor: AuraColors.surfaceElevated,
        borderRadius: AuraBorderRadius.xl,
        borderWidth: 1,
        borderColor: AuraColors.gray800,
        overflow: 'hidden',
        borderStyle: 'dashed',
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    placeholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(52, 199, 89, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeBtn: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    form: {
        gap: 24,
    },
    footer: {
        marginTop: 40,
    },
    submitBtn: {
        height: 60,
        borderRadius: 30,
    }
});
