import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, shadow, spacing, touch, type ThemeColors } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import AppIcon, { type AppIconName } from './AppIcon';

interface Props {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  appIcon?: AppIconName;
  onPress: () => void;
  color: string;
}

export default function QuickMenuButton({ title, icon, appIcon, onPress, color }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <TouchableOpacity style={styles.btn} onPress={onPress} activeOpacity={0.75} hitSlop={touch.hitSlop} accessibilityRole="button" accessibilityLabel={title}>
      <View style={[styles.iconCircle, { backgroundColor: color + '18' }]}>
        {appIcon ? <AppIcon name={appIcon} size={30} /> : <Ionicons name={icon} size={26} color={color} />}
      </View>
      <Text style={[styles.label, { color }]} numberOfLines={2}>{title}</Text>
    </TouchableOpacity>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  btn: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadow.card,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});
