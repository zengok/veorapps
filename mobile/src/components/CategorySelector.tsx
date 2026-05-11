import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Category } from '../types';
import { radius, shadow, spacing, touch, type ThemeColors } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import AppIcon, { type AppIconName } from './AppIcon';

interface Props {
  selected: Category | null;
  onChange: (cat: Category) => void;
}

const CATEGORIES: { value: Category; label: string; icon: AppIconName }[] = [
  { value: 'WOMEN', label: 'Kadın Parfümü', icon: 'flower' },
  { value: 'MEN', label: 'Erkek Parfümü', icon: 'drop' },
];

export default function CategorySelector({ selected, onChange }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Kategori Seçin</Text>
      <View style={styles.row}>
        {CATEGORIES.map((cat) => {
          const isActive = selected === cat.value;
          return (
            <TouchableOpacity
              key={cat.value}
              style={[styles.btn, isActive && styles.btnActive]}
              onPress={() => onChange(cat.value)}
              activeOpacity={0.8}
              hitSlop={touch.hitSlop}
              accessibilityRole="button"
              accessibilityLabel={`${cat.label} seç`}
            >
              <AppIcon name={cat.icon} size={42} opacity={isActive ? 1 : 0.62} />
              <Text style={[styles.label, isActive && styles.labelActive]} numberOfLines={2}>
                {cat.label}
              </Text>
              {isActive && (
                <View style={styles.activeDot} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  heading: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.inkMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  btn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 108,
    paddingVertical: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.borderSoft,
    ...shadow.card,
  },
  btnActive: {
    borderColor: colors.gold,
    backgroundColor: colors.surfaceWarm,
    ...shadow.lifted,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  labelActive: {
    color: colors.gold,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
    marginTop: spacing.sm,
  },
});
