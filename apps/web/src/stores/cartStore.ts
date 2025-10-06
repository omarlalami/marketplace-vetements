// stores/cartStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  productId: string; // ID du produit original
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
  addItem: (item: Omit<CartItem, 'quantity' | 'id'> & Partial<Pick<CartItem, 'shopName' | 'shopSlug' | 'selectedVariants'>>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

// Fonction pour créer un ID unique basé sur le produit et ses variantes
const createCartItemId = (productId: string, variants?: Record<string, string>): string => {
  if (!variants || Object.keys(variants).length === 0) {
    return productId;
  }
  // Trier les clés pour assurer la cohérence
  const sortedVariants = Object.keys(variants)
    .sort()
    .map(key => `${key}:${variants[key]}`)
    .join('|');
  return `${productId}__${sortedVariants}`;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const items = get().items;
        
        // Créer un ID unique pour ce produit avec ses variantes
        const cartItemId = createCartItemId(item.productId, item.selectedVariants);
        const existingItem = items.find((i) => i.id === cartItemId);

        // S'assurer que le prix est un nombre
        const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;

        if (existingItem) {
          set({
            items: items.map((i) =>
              i.id === cartItemId
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          });
        } else {
          set({ 
            items: [...items, { 
              ...item, 
              id: cartItemId,
              price, 
              quantity: 1 
            }] 
          });
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }

        set({
          items: get().items.map((item) =>
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