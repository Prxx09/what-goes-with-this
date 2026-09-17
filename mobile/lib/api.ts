import Constants from 'expo-constants';
import { fetch as expoFetch } from 'expo/fetch';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';

export type WardrobeCategory = 'top' | 'bottom' | 'shoes' | 'outerwear' | 'accessory' | 'other';

export type ClothingAnalysis = {
  category: WardrobeCategory;
  item_type: string;
  primary_color: string;
  secondary_colors: string[];
  pattern: string;
  style_tags: string[];
  season_tags: string[];
  confidence: number;
};

export type WardrobeItem = {
  id: string;
  name: string;
  category: WardrobeCategory;
  color?: string | null;
  image_uri?: string | null;
  item_type?: string | null;
  secondary_colors: string[];
  pattern?: string | null;
  style_tags: string[];
  season_tags: string[];
  ai_confidence?: number | null;
  created_at: string;
};

export type WardrobeItemCreate = {
  name: string;
  category: WardrobeCategory;
  color?: string;
  image_uri?: string;
  item_type?: string;
  secondary_colors?: string[];
  pattern?: string;
  style_tags?: string[];
  season_tags?: string[];
  ai_confidence?: number;
};

function getExpoDevHost(): string | null {
  if (Platform.OS === 'web') return null;

  const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost;
  if (!hostUri) return null;

  const host = hostUri.split(':')[0];
  return host || null;
}

function resolveApiUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  const devHost = getExpoDevHost();

  if (configured) {
    if (Platform.OS !== 'web' && devHost && /\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(configured)) {
      const portMatch = configured.match(/:(\d+)$/);
      const port = portMatch?.[1] ?? '8000';
      return `http://${devHost}:${port}`;
    }

    return configured.replace(/\/$/, '');
  }

  if (Platform.OS !== 'web' && devHost) {
    return `http://${devHost}:8000`;
  }

  return 'http://localhost:8000';
}

const API_URL = resolveApiUrl();
console.log('[api] resolved base URL:', API_URL);

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_URL}${path}`;
  console.log('[api]', init?.method ?? 'GET', url);

  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(detail || `API request failed (${response.status})`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

async function uploadForm<T>(path: string, uri: string): Promise<T> {
  const url = `${API_URL}${path}`;
  console.log('[api] POST', url);

  let response: Response;

  if (Platform.OS === 'web') {
    const imageResponse = await fetch(uri);
    if (!imageResponse.ok) {
      throw new Error(`Could not read selected image (${imageResponse.status})`);
    }

    const blob = await imageResponse.blob();
    const fileName = blob.type === 'image/png'
      ? 'wardrobe.png'
      : blob.type === 'image/webp'
        ? 'wardrobe.webp'
        : 'wardrobe.jpg';

    const form = new FormData();
    form.append('file', blob, fileName);

    response = await fetch(url, {
      method: 'POST',
      body: form,
    });
  } else {
    const file = new File(uri);
    if (!file.exists) {
      throw new Error('Selected image file is no longer available');
    }

    const form = new FormData();
    form.append('file', file);

    response = await expoFetch(url, {
      method: 'POST',
      body: form,
    }) as unknown as Response;
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(detail || `Upload failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

export const wardrobeApi = {
  list: () => request<WardrobeItem[]>('/api/v1/wardrobe'),
  create: (item: WardrobeItemCreate) =>
    request<WardrobeItem>('/api/v1/wardrobe', {
      method: 'POST',
      body: JSON.stringify(item),
    }),
  remove: (id: string) => request<void>(`/api/v1/wardrobe/${id}`, { method: 'DELETE' }),
  analyzeImage: (uri: string) => uploadForm<ClothingAnalysis>('/api/v1/analyze-clothing', uri),
  uploadImage: (uri: string) => uploadForm<{ image_uri: string }>('/api/v1/uploads', uri),
};
