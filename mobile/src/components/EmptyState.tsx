import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing, type ThemeColors } from '../theme';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  compact?: boolean;
}

export default function EmptyState({ icon, title, description, compact }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={compact ? 30 : 40} color={colors.gold} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.sm,
  },
  wrapCompact: {
    paddingTop: spacing.xxl,
    justifyContent: 'flex-start',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    color: colors.ink,
    fontWeight: '800',
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 260,
  },
});
