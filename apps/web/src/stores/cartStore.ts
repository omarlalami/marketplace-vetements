// stores/cartStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  shopName?: string;
  shopSlug?: string;
  selectedVariants?: Record<string, string>;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'> & Partial<Pick<CartItem, 'shopName' | 'shopSlug' | 'selectedVariants'>>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  loadCart: () => void; // New method to sync with storage
}

const createCartItemId = (productId: string, variants?: Record<string, string>): string => {
  if (!variants || Object.keys(variants).length === 0) {
    return productId;
  }
  const sortedVariants = Object.keys(variants)
    .sort()
    .map(key => `${key}:${variants[key]}`)
    .join('|');
  return `${productId}__${sortedVariants}`;
};

// Helper to safely read from localStorage
const safeGetFromStorage = (): CartItem[] => {
  try {
    const stored = localStorage.getItem('cart-storage');
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    // Handle both old and new Zustand persist format
    return parsed.state?.items || parsed.items || [];
  } catch (error) {
    console.error('Error reading cart from storage:', error);
    return [];
  }
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      loadCart: () => {
        // Force reload from localStorage to sync across tabs
        const storedItems = safeGetFromStorage();
        set({ items: storedItems });
      },

      addItem: (item) => {
        // Always read fresh state from storage first
        const storedItems = safeGetFromStorage();
        const cartItemId = createCartItemId(item.productId, item.selectedVariants);
        const existingItem = storedItems.find((i) => i.id === cartItemId);

        const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
        let newItems: CartItem[];

        if (existingItem) {
          newItems = storedItems.map((i) =>
            i.id === cartItemId
              ? { ...i, quantity: i.quantity + (item.quantity || 1) }
              : i
          );
        } else {
          newItems = [
            ...storedItems,
            {
              ...item,
              id: cartItemId,
              price,
              quantity: item.quantity || 1,
            },
          ];
        }

        set({ items: newItems });
      },

      removeItem: (id) => {
        const storedItems = safeGetFromStorage();
        set({ items: storedItems.filter((item) => item.id !== id) });
      },

      updateQuantity: (id, quantity) => {
        const storedItems = safeGetFromStorage();
        
        if (quantity <= 0) {
          set({ items: storedItems.filter((item) => item.id !== id) });
          return;
        }

        set({
          items: storedItems.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => {
            const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
            return total + (price * item.quantity);
          },
          0
        );
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);

// Listen for storage changes across tabs
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'cart-storage') {
      // Reload cart when storage changes in another tab
      useCartStore.getState().loadCart();
    }
  });
}