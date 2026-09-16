export type WardrobeCategory = 'top' | 'bottom' | 'shoes' | 'outerwear' | 'accessory' | 'other';

export type WardrobeItem = {
  id: string;
  name: string;
  category: WardrobeCategory;
  color?: string | null;
  image_uri?: string | null;
  created_at: string;
};

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) throw new Error(`API request failed (${response.status})`);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const wardrobeApi = {
  list: () => request<WardrobeItem[]>('/api/v1/wardrobe'),
  create: (item: { name: string; category: WardrobeCategory; color?: string; image_uri?: string }) =>
    request<WardrobeItem>('/api/v1/wardrobe', { method: 'POST', body: JSON.stringify(item) }),
  remove: (id: string) => request<void>(`/api/v1/wardrobe/${id}`, { method: 'DELETE' }),
};
