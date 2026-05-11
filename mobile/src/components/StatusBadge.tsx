import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing } from '../theme';
import { useTheme } from '../contexts/ThemeContext';

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface Props {
  label: string;
  tone?: Tone;
  icon?: keyof typeof Ionicons.glyphMap;
}

export default function StatusBadge({ label, tone = 'neutral', icon }: Props) {
  const { colors } = useTheme();
  const toneStyles: Record<Tone, { bg: string; fg: string }> = {
    success: { bg: colors.greenBg, fg: colors.green },
    warning: { bg: colors.orangeBg, fg: colors.orange },
    danger: { bg: colors.redBg, fg: colors.red },
    info: { bg: colors.blueBg, fg: colors.blue },
    neutral: { bg: colors.surfaceSoft, fg: colors.inkMuted },
  };
  const style = toneStyles[tone];
  return (
    <View style={[styles.badge, { backgroundColor: style.bg }]}>
      {icon ? <Ionicons name={icon} size={12} color={style.fg} /> : null}
      <Text style={[styles.text, { color: style.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    gap: 4,
    maxWidth: '100%',
  },
  text: {
    fontSize: 10,
    fontWeight: '800',
    flexShrink: 1,
  },
});
