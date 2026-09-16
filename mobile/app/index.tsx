import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WardrobeScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>YOUR CLOSET, YOUR OUTFITS</Text>
        <Text style={styles.title}>What goes with this?</Text>
        <Text style={styles.subtitle}>
          Add the clothes you own once. We’ll use your wardrobe to build outfit combinations without suggesting things you don’t have.
        </Text>
      </View>

      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Your wardrobe is empty</Text>
        <Text style={styles.emptyCopy}>Start with one item. A clean photo is enough.</Text>
        <Link href="/add-item" asChild>
          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Add first item</Text>
          </Pressable>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF8', padding: 20 },
  hero: { paddingTop: 24, gap: 10 },
  eyebrow: { fontSize: 12, letterSpacing: 1.6, fontWeight: '700', color: '#666' },
  title: { fontSize: 36, lineHeight: 41, fontWeight: '800', color: '#151515' },
  subtitle: { fontSize: 16, lineHeight: 24, color: '#555', maxWidth: 560 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#171717' },
  emptyCopy: { fontSize: 15, color: '#666', textAlign: 'center' },
  primaryButton: { marginTop: 8, backgroundColor: '#171717', borderRadius: 16, paddingHorizontal: 24, paddingVertical: 15 },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
