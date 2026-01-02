import React from 'react';
import { Text, TextProps } from 'react-native';
import { AuraTypography } from '../theme/aura';

interface AuraTextProps extends TextProps {
    variant?: keyof typeof AuraTypography;
    color?: string;
    align?: 'left' | 'center' | 'right' | 'justify';
    center?: boolean;
    gradient?: boolean; // Future support
}

export const AuraText: React.FC<AuraTextProps> = ({
    children,
    variant = 'body',
    color,
    align = 'left',
    center,
    style,
    ...props
}) => {
    // Default colors based on variant


    return (
        <Text
            style={[
                AuraTypography[variant] || AuraTypography.body,
                color ? { color } : {},
                { textAlign: center ? 'center' : align },
                style
            ]}
            {...props}
        >
            {children}
        </Text>
    );
};
