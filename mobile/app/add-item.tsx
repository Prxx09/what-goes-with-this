import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddItemScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);

  const chooseImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Text style={styles.title}>Add a wardrobe item</Text>
      <Text style={styles.copy}>Use one clothing item per photo for the fastest and most reliable first version.</Text>

      <View style={styles.preview}>
        {imageUri ? <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" /> : <Text style={styles.placeholder}>Image preview</Text>}
      </View>

      <Pressable style={styles.primary} onPress={takePhoto}><Text style={styles.primaryText}>Take photo</Text></Pressable>
      <Pressable style={styles.secondary} onPress={chooseImage}><Text style={styles.secondaryText}>Choose from library</Text></Pressable>

      {imageUri && <Text style={styles.hint}>Selected. Next we’ll connect this step to wardrobe storage and AI item analysis.</Text>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#FAFAF8', gap: 14 },
  title: { marginTop: 20, fontSize: 28, fontWeight: '800', color: '#171717' },
  copy: { fontSize: 15, lineHeight: 22, color: '#666' },
  preview: { height: 330, marginVertical: 12, borderRadius: 24, backgroundColor: '#EFEFEB', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  placeholder: { color: '#888', fontWeight: '600' },
  primary: { backgroundColor: '#171717', borderRadius: 16, padding: 16, alignItems: 'center' },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondary: { borderWidth: 1, borderColor: '#CCC', borderRadius: 16, padding: 16, alignItems: 'center' },
  secondaryText: { color: '#171717', fontSize: 16, fontWeight: '700' },
  hint: { color: '#666', fontSize: 13, lineHeight: 19, textAlign: 'center' },
});
