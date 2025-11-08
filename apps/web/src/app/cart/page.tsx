'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '@/stores/cartStore';
import Image from 'next/image';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { ClientLayout } from '@/components/layout/ClientLayout'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

const formatPrice = (price: number | string): string => {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(num)) return '0';
  
  // Si c'est un nombre entier, pas de décimales
  if (num === Math.floor(num)) {
    return num.toString();
  }
  
  // Sinon, afficher avec 2 décimales
  return num.toFixed(2);
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <ClientLayout>
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Mon Panier</h1>
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <ShoppingCart className="w-24 h-24 mx-auto text-gray-300 mb-4 animate-pulse" />
            <p className="text-gray-500">Chargement...</p>
          </div>
        </div>
      </div>
      </ClientLayout>
    );
  }

  if (items.length === 0) {
    return (
      <ClientLayout>
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Mon Panier</h1>
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <ShoppingCart className="w-24 h-24 mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">
              Votre panier est vide
            </h2>
            <p className="text-gray-500">
              Ajoutez des produits pour commencer vos achats
            </p>
          </div>
        </div>
      </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Mon Panier</h1>
          <button
            onClick={clearCart}
            className="text-red-600 hover:text-red-700 font-medium flex items-center gap-2"
          >
            <Trash2 className="w-5 h-5" />
            Vider le panier
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Liste des produits regroupés par boutique */}
          <div className="lg:col-span-2 space-y-6">
            {Object.entries(
              items.reduce((acc, item) => {
                if (!acc[item.shopName || 'Boutique inconnue']) acc[item.shopName || 'Boutique inconnue'] = [];
                acc[item.shopName || 'Boutique inconnue'].push(item);
                return acc;
              }, {} as Record<string, typeof items>)
            ).map(([shopName, shopItems]) => (
              <div key={shopName} className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold mb-4">Boutique : {shopName}</h2>
                <p className="text-gray-500 text-sm mb-4">
                  Total boutique : {formatPrice(shopItems.reduce((sum, i) => sum + (parseFloat(formatPrice(i.price)) * i.quantity), 0).toFixed(2))} DZD
                </p>

                <div className="space-y-4">
                  {shopItems.map((item) => (
                    <div
                      key={item.id}
                      className="border rounded-lg p-4 flex gap-4 items-start"
                    >
                      {item.image && (
                        <div className="w-20 h-20 relative rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}

                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{item.name}</h3>                  
                        <p className="text-gray-600">
                          {formatPrice(item.price)} DZD / unité
                        </p>

                        {/* Variantes */}
                        {item.selectedVariants &&
                          Object.keys(item.selectedVariants).length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {Object.entries(item.selectedVariants).map(
                                ([type, value]) => (
                                  <span
                                    key={type}
                                    className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                                  >
                                    {type === 'size'
                                      ? 'Taille'
                                      : type === 'color'
                                      ? 'Couleur'
                                      : type}{' '}
                                    : {value}
                                  </span>
                                )
                              )}
                            </div>
                          )}

                        {/* Contrôles quantité + suppression */}
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="font-medium w-8 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-center gap-4">

                            <p className="font-bold text-lg">
                              {formatPrice(
                                (typeof item.price === 'number'
                                  ? item.price
                                  : parseFloat(item.price)) * item.quantity
                              )} DZD
                            </p>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-red-600 hover:text-red-700 p-2"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Résumé de la commande */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-6">Résumé</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Sous-total</span>
                  <span>{formatPrice(getTotalPrice())} DZD</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Les tarifs de livraisons seront communiqués par les différentes Boutiques</span>
                </div> 
{/*                 <div className="flex justify-between text-gray-600">
                  <span>Livraison</span>
                  <span>Gratuite</span>
                </div> */}
                <div className="border-t pt-3 flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatPrice(getTotalPrice())} DZD</span>
                </div>
              </div>

              <Button onClick={() => router.push('/checkout')} className="w-full">
                Passer la commande
              </Button>

              <p className="text-sm text-gray-500 text-center mt-4">
                {items.length} article{items.length > 1 ? 's' : ''} dans le panier
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </ClientLayout>
  );
}