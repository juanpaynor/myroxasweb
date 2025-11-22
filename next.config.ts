import type {NextConfig} from 'next';

type StorageLike = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
  clear: () => void
  key: (index: number) => string | null
  readonly length: number
}

function ensureNodeStorage() {
  if (typeof window !== 'undefined') {
    return;
  }

  const createMemoryStorage = (): StorageLike => {
    const store = new Map<string, string>();

    return {
      getItem: (key) => (store.has(key) ? store.get(key)! : null),
      setItem: (key, value) => {
        store.set(key, String(value ?? ''));
      },
      removeItem: (key) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
      key: (index) => Array.from(store.keys())[index] ?? null,
      get length() {
        return store.size;
      },
    };
  };

  const globals = globalThis as Record<string, unknown>;
  for (const name of ['localStorage', 'sessionStorage']) {
    const candidate = globals[name] as Partial<StorageLike> | undefined;
    if (!candidate || typeof candidate.getItem !== 'function') {
      globals[name] = createMemoryStorage();
    }
  }
}

ensureNodeStorage();

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
