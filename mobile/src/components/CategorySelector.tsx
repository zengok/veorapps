import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Category } from '../types';

interface Props {
  selected: Category | null;
  onChange: (cat: Category) => void;
}

const CATEGORIES: { value: Category; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'WOMEN', label: 'Kadın Parfümü', icon: 'rose-outline' },
  { value: 'MEN', label: 'Erkek Parfümü', icon: 'water-outline' },
];

export default function CategorySelector({ selected, onChange }: Props) {
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
            >
              <Ionicons
                name={cat.icon}
                size={34}
                color={isActive ? '#c9a961' : '#999'}
              />
              <Text style={[styles.label, isActive && styles.labelActive]}>
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

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  heading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  btnActive: {
    borderColor: '#c9a961',
    backgroundColor: '#fffbf0',
    elevation: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
  },
  labelActive: {
    color: '#c9a961',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#c9a961',
    marginTop: 8,
  },
});
