export type WardrobeCategory = 'top' | 'bottom' | 'shoes' | 'outerwear' | 'accessory' | 'other';

export type WardrobeItem = {
  id: string;
  name: string;
  category: WardrobeCategory;
  color?: string | null;
  image_url?: string | null;
  created_at: string;
};

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

async function jsonRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) throw new Error(`API request failed (${response.status})`);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const resolveImageUrl = (path?: string | null) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_URL}${path}`;
};

export const wardrobeApi = {
  list: () => jsonRequest<WardrobeItem[]>('/api/v1/wardrobe'),
  create: (item: { name: string; category: WardrobeCategory; color?: string; image_url?: string }) =>
    jsonRequest<WardrobeItem>('/api/v1/wardrobe', { method: 'POST', body: JSON.stringify(item) }),
  remove: (id: string) => jsonRequest<void>(`/api/v1/wardrobe/${id}`, { method: 'DELETE' }),
  uploadImage: async (uri: string) => {
    const form = new FormData();
    form.append('file', { uri, name: 'wardrobe-item.jpg', type: 'image/jpeg' } as any);
    const response = await fetch(`${API_URL}/api/v1/uploads`, { method: 'POST', body: form });
    if (!response.ok) throw new Error(`Upload failed (${response.status})`);
    return response.json() as Promise<{ image_url: string }>;
  },
};
