import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { wardrobeApi, WardrobeItem } from '../lib/api';

export default function WardrobeScreen() {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWardrobe = useCallback(async () => {
    try {
      setError(null);
      setItems(await wardrobeApi.list());
    } catch {
      setError('Could not reach the wardrobe API.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void loadWardrobe(); }, [loadWardrobe]));

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>YOUR CLOSET, YOUR OUTFITS</Text>
        <Text style={styles.title}>My Wardrobe</Text>
        <View style={styles.row}>
          <Text style={styles.subtitle}>{items.length} {items.length === 1 ? 'item' : 'items'}</Text>
          <Link href="/add-item" asChild><Pressable style={styles.addButton}><Text style={styles.addButtonText}>+ Add</Text></Pressable></Link>
        </View>
      </View>

      {loading ? <ActivityIndicator style={styles.center} /> : error ? (
        <View style={styles.center}><Text style={styles.error}>{error}</Text><Pressable onPress={loadWardrobe}><Text style={styles.retry}>Retry</Text></Pressable></View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Your wardrobe is empty</Text>
          <Text style={styles.emptyCopy}>Start with one item. A clean photo is enough.</Text>
          <Link href="/add-item" asChild><Pressable style={styles.primaryButton}><Text style={styles.primaryButtonText}>Add first item</Text></Pressable></Link>
        </View>
      ) : (
        <FlatList
          data={items}
          numColumns={2}
          keyExtractor={(item) => item.id}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.imageBox}>{item.image_uri ? <Image source={{ uri: item.image_uri }} style={styles.image} /> : <Text style={styles.imagePlaceholder}>No image</Text>}</View>
              <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.meta}>{item.color ? `${item.color} · ` : ''}{item.category}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF8', paddingHorizontal: 20 },
  hero: { paddingTop: 24, gap: 8 },
  eyebrow: { fontSize: 12, letterSpacing: 1.6, fontWeight: '700', color: '#666' },
  title: { fontSize: 34, fontWeight: '800', color: '#151515' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subtitle: { fontSize: 15, color: '#666' },
  addButton: { backgroundColor: '#171717', borderRadius: 14, paddingHorizontal: 17, paddingVertical: 10 },
  addButtonText: { color: '#fff', fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#171717' },
  emptyCopy: { fontSize: 15, color: '#666', textAlign: 'center' },
  primaryButton: { marginTop: 8, backgroundColor: '#171717', borderRadius: 16, paddingHorizontal: 24, paddingVertical: 15 },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  error: { color: '#8A3030' }, retry: { fontWeight: '700' },
  grid: { paddingTop: 24, paddingBottom: 30 }, gridRow: { gap: 12 },
  card: { flex: 1, marginBottom: 20, maxWidth: '49%' },
  imageBox: { aspectRatio: 0.82, borderRadius: 18, backgroundColor: '#EFEFEB', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' }, imagePlaceholder: { color: '#999' },
  itemName: { marginTop: 9, fontWeight: '700', fontSize: 15, color: '#171717' }, meta: { marginTop: 3, fontSize: 12, color: '#777', textTransform: 'capitalize' },
});
