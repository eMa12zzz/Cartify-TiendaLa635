import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import SearchBar from '../../components/Usuario/SearchBar';
import { colors, typography, spacing } from '../../theme/Usuario';
import { searchProducts } from '../../api/Usuario/products';
export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const fetchSuggestions = useCallback(async q => {
    if (!q) {
      setSuggestions([]);
      return;
    }
    const results = await searchProducts(q);
    setSuggestions(results.length ? results : []);
  }, []);

  useEffect(() => {
    fetchSuggestions(query);
  }, [query, fetchSuggestions]);

  const goToResults = q => {
    if (!q) return;
    navigation.navigate('SearchResults', { query: q });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <IconoCerrar size={18} />
        </TouchableOpacity>
      </View>

      <SearchBar
        value={query}
        onChangeText={setQuery}
        onSubmit={() => goToResults(query)}
        onClear={() => setQuery('')}
        autoFocus
      />

      <FlatList
        data={suggestions}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => goToResults(item.name)}>
            <View style={styles.iconWrap}>
              <IconoBuscar size={14} />
            </View>
            <Text style={styles.rowLabel}>{item.name}</Text>
            <Text style={styles.rowCount}>{item.stock ?? ''}</Text>
            <IconoChevronDerecha size={12} />
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  iconWrap: {
    width: 24,
    alignItems: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: typography.size.base,
    color: colors.text,
  },
  rowCount: {
    color: colors.textMuted,
    marginRight: spacing.sm,
  },
  separator: { height: 1, backgroundColor: colors.divider },
});
