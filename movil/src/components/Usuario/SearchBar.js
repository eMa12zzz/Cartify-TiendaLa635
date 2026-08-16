import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../../theme/Usuario';

export default function SearchBar({
  value,
  onChangeText,
  placeholder = 'Buscar producto',
  onSubmit,
  onMicPress,
  autoFocus = false,
  onClear,
  editable = true,
  onPress,
}) {
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <View style={styles.row}>
      <Wrapper style={styles.inputWrap} onPress={onPress} activeOpacity={0.8}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          onSubmitEditing={onSubmit}
          autoFocus={autoFocus}
          editable={editable}
          pointerEvents={editable ? 'auto' : 'none'}
        />
        {!!value && onClear && (
          <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </Wrapper>

      <TouchableOpacity style={styles.micButton} onPress={onMicPress}>
        <Text style={styles.micIcon}>🎙️</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    height: 44,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: { marginRight: spacing.sm },
  input: {
    flex: 1,
    fontSize: typography.size.base,
    color: colors.text,
  },
  clearIcon: { color: colors.textMuted, paddingHorizontal: 4 },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micIcon: { fontSize: typography.size.base },
});
