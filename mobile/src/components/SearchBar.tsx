import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing, touch, type ThemeColors } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import AppIcon from './AppIcon';

interface Props {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChangeText, placeholder = 'Ürün ara' }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View style={styles.wrap}>
      <AppIcon name="search" size={22} opacity={0.72} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.faint}
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel={placeholder}
      />
      {value ? (
        <TouchableOpacity
          style={styles.clearBtn}
          onPress={() => onChangeText('')}
          hitSlop={touch.hitSlop}
          accessibilityRole="button"
          accessibilityLabel="Aramayı temizle"
        >
          <Ionicons name="close-circle" size={18} color={colors.faint} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    height: 44,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.ink,
    paddingVertical: 0,
  },
  clearBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
