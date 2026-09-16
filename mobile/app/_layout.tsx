import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShadowVisible: false }}>
        <Stack.Screen name="index" options={{ title: 'My Wardrobe' }} />
        <Stack.Screen name="add-item" options={{ title: 'Add Item', presentation: 'modal' }} />
      </Stack>
    </>
  );
}
