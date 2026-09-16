import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { wardrobeApi, WardrobeCategory } from '../lib/api';

const categories: WardrobeCategory[] = ['top', 'bottom', 'shoes', 'outerwear', 'accessory', 'other'];

export default function AddItemScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('');
  const [category, setCategory] = useState<WardrobeCategory>('other');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chooseImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.8 });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.8 });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const saveItem = async () => {
    if (!imageUri || !name.trim()) {
      setError('Add a photo and item name first.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const upload = await wardrobeApi.uploadImage(imageUri);
      await wardrobeApi.create({
        name: name.trim(),
        category,
        color: color.trim() || undefined,
        image_url: upload.image_url,
      });
      router.back();
    } catch {
      setError('Could not save this wardrobe item. Check that the API is running and reachable.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Text style={styles.title}>Add a wardrobe item</Text>
      <Text style={styles.copy}>One item per photo keeps ingestion fast and gives cleaner AI metadata later.</Text>

      <View style={styles.preview}>
        {imageUri ? <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" /> : <Text style={styles.placeholder}>Image preview</Text>}
      </View>

      <View style={styles.imageActions}>
        <Pressable style={styles.secondarySmall} onPress={takePhoto}><Text style={styles.secondaryText}>Camera</Text></Pressable>
        <Pressable style={styles.secondarySmall} onPress={chooseImage}><Text style={styles.secondaryText}>Gallery</Text></Pressable>
      </View>

      <TextInput style={styles.input} placeholder="Item name, e.g. Black oversized tee" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Color (optional)" value={color} onChangeText={setColor} />

      <View style={styles.chips}>
        {categories.map((value) => (
          <Pressable key={value} onPress={() => setCategory(value)} style={[styles.chip, category === value && styles.chipActive]}>
            <Text style={[styles.chipText, category === value && styles.chipTextActive]}>{value}</Text>
          </Pressable>
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={[styles.primary, saving && styles.disabled]} onPress={saveItem} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Save to wardrobe</Text>}
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#FAFAF8', gap: 12 },
  title: { marginTop: 10, fontSize: 28, fontWeight: '800', color: '#171717' },
  copy: { fontSize: 15, lineHeight: 22, color: '#666' },
  preview: { height: 260, marginVertical: 8, borderRadius: 24, backgroundColor: '#EFEFEB', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  placeholder: { color: '#888', fontWeight: '600' },
  imageActions: { flexDirection: 'row', gap: 10 },
  secondarySmall: { flex: 1, borderWidth: 1, borderColor: '#CCC', borderRadius: 14, padding: 12, alignItems: 'center' },
  secondaryText: { color: '#171717', fontSize: 15, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 14, backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 13, fontSize: 15 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: '#D5D5D0', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  chipActive: { backgroundColor: '#171717', borderColor: '#171717' },
  chipText: { color: '#555', textTransform: 'capitalize', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  primary: { marginTop: 'auto', backgroundColor: '#171717', borderRadius: 16, padding: 16, alignItems: 'center' },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.6 },
  error: { color: '#8A3030', fontSize: 13 },
});
