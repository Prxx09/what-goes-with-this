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

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

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

async function createImageForm(uri: string): Promise<FormData> {
  const form = new FormData();

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

    form.append('file', blob, fileName);
    return form;
  }

  const clean = uri.split('?')[0].toLowerCase();
  const type = clean.endsWith('.png') ? 'image/png' : clean.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
  const extension = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';

  form.append('file', {
    uri,
    name: `wardrobe.${extension}`,
    type,
  } as any);

  return form;
}

async function uploadForm<T>(path: string, uri: string): Promise<T> {
  const form = await createImageForm(uri);
  const url = `${API_URL}${path}`;
  console.log('[api] POST', url);

  const response = await fetch(url, {
    method: 'POST',
    body: form,
  });

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
