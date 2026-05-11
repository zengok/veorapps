import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, shadow, spacing, type ThemeColors } from '../theme';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  compact?: boolean;
}

export default function DashboardCard({ title, value, subtitle, icon, color, compact }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <View style={[styles.iconWrap, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={compact ? 18 : 22} color={color} />
      </View>
      <Text style={[styles.value, compact && styles.valueCompact]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.title, compact && styles.titleCompact]} numberOfLines={1}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadow.card,
  },
  cardCompact: {
    padding: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 2,
  },
  valueCompact: {
    fontSize: 17,
    marginBottom: 2,
  },
  title: {
    fontSize: 11,
    color: colors.inkMuted,
    fontWeight: '600',
  },
  titleCompact: {
    fontSize: 10,
  },
  subtitle: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 2,
  },
});
