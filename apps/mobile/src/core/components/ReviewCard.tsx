import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AuraColors, AuraShadows } from '../theme/aura';
import { Star } from 'lucide-react-native';
import { AuraText } from './AuraText';
import { AuraAvatar } from './AuraAvatar';

type ReviewCardProps = {
    reviewerName: string;
    reviewerAvatar?: string;
    rating: number;
    comment: string;
    date: string;
};

export const ReviewCard = React.memo(function ReviewCard({ reviewerName, reviewerAvatar, rating, comment, date }: ReviewCardProps) {
    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={styles.userInfo}>
                    <AuraAvatar source={reviewerAvatar} size={32} />
                    <View style={styles.userDetails}>
                        <AuraText variant="caption" style={styles.userName}>{reviewerName}</AuraText>
                        <AuraText variant="label" color={AuraColors.gray500}>{date}</AuraText>
                    </View>
                </View>
                <View style={styles.rating}>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                            key={i}
                            size={12}
                            color={i < rating ? AuraColors.white : AuraColors.gray100}
                            fill={i < rating ? AuraColors.white : 'transparent'}
                        />
                    ))}
                </View>
            </View>
            <AuraText variant="caption" color={AuraColors.gray300} style={styles.comment}>
                {comment}
            </AuraText>
        </View>
    );
});

const styles = StyleSheet.create({
    card: {
        backgroundColor: AuraColors.surface,
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: AuraColors.gray100,
        ...AuraShadows.soft
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rating: {
        flexDirection: 'row',
        gap: 2
    },
    userDetails: {
        marginLeft: 12,
    },
    userName: {
        fontWeight: 'bold',
    },
    comment: {
        marginTop: 12,
        lineHeight: 18,
    }
});
