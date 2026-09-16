import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClothingAnalysis, wardrobeApi, WardrobeCategory } from '../lib/api';

const categories: WardrobeCategory[] = ['top', 'bottom', 'shoes', 'outerwear', 'accessory', 'other'];

export default function AddItemScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('');
  const [category, setCategory] = useState<WardrobeCategory>('other');
  const [analysis, setAnalysis] = useState<ClothingAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeSelectedImage = async (uri: string) => {
    setImageUri(uri);
    setAnalysis(null);
    setAnalyzing(true);
    setError(null);
    try {
      const result = await wardrobeApi.analyzeImage(uri);
      setAnalysis(result);
      setCategory(result.category);
      setColor(result.primary_color);
      setName(`${result.primary_color} ${result.item_type}`.trim());
    } catch {
      setError('AI analysis failed. You can still enter the details manually and save the item.');
    } finally {
      setAnalyzing(false);
    }
  };

  const chooseImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.8 });
    if (!result.canceled) await analyzeSelectedImage(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('Camera permission is required to take a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.8 });
    if (!result.canceled) await analyzeSelectedImage(result.assets[0].uri);
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
        image_uri: upload.image_uri,
        item_type: analysis?.item_type,
        secondary_colors: analysis?.secondary_colors,
        pattern: analysis?.pattern,
        style_tags: analysis?.style_tags,
        season_tags: analysis?.season_tags,
        ai_confidence: analysis?.confidence,
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
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Add a wardrobe item</Text>
        <Text style={styles.copy}>Take or choose one clear clothing photo. AI analyzes it once, then you can correct anything before saving.</Text>

        <View style={styles.preview}>
          {imageUri ? <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" /> : <Text style={styles.placeholder}>Image preview</Text>}
          {analyzing ? <View style={styles.analysisOverlay}><ActivityIndicator color="#fff" /><Text style={styles.analysisOverlayText}>Analyzing clothing…</Text></View> : null}
        </View>

        <View style={styles.imageActions}>
          <Pressable style={styles.secondarySmall} onPress={takePhoto} disabled={analyzing || saving}><Text style={styles.secondaryText}>Camera</Text></Pressable>
          <Pressable style={styles.secondarySmall} onPress={chooseImage} disabled={analyzing || saving}><Text style={styles.secondaryText}>Gallery</Text></Pressable>
        </View>

        {analysis ? (
          <View style={styles.aiCard}>
            <Text style={styles.aiTitle}>AI detected</Text>
            <Text style={styles.aiText}>{analysis.item_type} · {analysis.pattern} · {Math.round(analysis.confidence * 100)}% confidence</Text>
            {analysis.style_tags.length ? <Text style={styles.aiSubtext}>{analysis.style_tags.join(' · ')}</Text> : null}
          </View>
        ) : null}

        <TextInput style={styles.input} placeholder="Item name, e.g. Black oversized tee" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Primary color" value={color} onChangeText={setColor} />

        <View style={styles.chips}>
          {categories.map((value) => (
            <Pressable key={value} onPress={() => setCategory(value)} style={[styles.chip, category === value && styles.chipActive]}>
              <Text style={[styles.chipText, category === value && styles.chipTextActive]}>{value}</Text>
            </Pressable>
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={[styles.primary, (saving || analyzing) && styles.disabled]} onPress={saveItem} disabled={saving || analyzing}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Save to wardrobe</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF8' },
  content: { padding: 20, gap: 12, paddingBottom: 32 },
  title: { marginTop: 10, fontSize: 28, fontWeight: '800', color: '#171717' },
  copy: { fontSize: 15, lineHeight: 22, color: '#666' },
  preview: { height: 260, marginVertical: 8, borderRadius: 24, backgroundColor: '#EFEFEB', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  placeholder: { color: '#888', fontWeight: '600' },
  analysisOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.48)', alignItems: 'center', justifyContent: 'center', gap: 10 },
  analysisOverlayText: { color: '#fff', fontWeight: '700' },
  imageActions: { flexDirection: 'row', gap: 10 },
  secondarySmall: { flex: 1, borderWidth: 1, borderColor: '#CCC', borderRadius: 14, padding: 12, alignItems: 'center' },
  secondaryText: { color: '#171717', fontSize: 15, fontWeight: '700' },
  aiCard: { backgroundColor: '#F0F0EA', borderRadius: 16, padding: 14, gap: 4 },
  aiTitle: { fontWeight: '800', color: '#171717' },
  aiText: { color: '#333', textTransform: 'capitalize' },
  aiSubtext: { color: '#666', fontSize: 13, textTransform: 'capitalize' },
  input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 14, backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 13, fontSize: 15 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: '#D5D5D0', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  chipActive: { backgroundColor: '#171717', borderColor: '#171717' },
  chipText: { color: '#555', textTransform: 'capitalize', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  primary: { marginTop: 10, backgroundColor: '#171717', borderRadius: 16, padding: 16, alignItems: 'center' },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.6 },
  error: { color: '#8A3030', fontSize: 13, lineHeight: 18 },
});
