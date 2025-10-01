'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '@/stores/cartStore';
import Image from 'next/image';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { ClientLayout } from '@/components/layout/ClientLayout'

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice } = useCartStore();
  const [mounted, setMounted] = useState(false);

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
          {/* Liste des produits */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-sm p-6 flex gap-4"
              >
                {item.image && (
                  <div className="w-24 h-24 relative rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                    <p className="text-gray-600">
                      {typeof item.price === 'number' ? item.price.toFixed(2) : parseFloat(item.price).toFixed(2)} €
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    {/* Contrôles de quantité */}
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

                    {/* Prix total et suppression */}
                    <div className="flex items-center gap-4">
                      <p className="font-bold text-lg">
                        {(typeof item.price === 'number' ? item.price * item.quantity : parseFloat(item.price) * item.quantity).toFixed(2)} €
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

          {/* Résumé de la commande */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-6">Résumé</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Sous-total</span>
                  <span>{getTotalPrice().toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Livraison</span>
                  <span>Gratuite</span>
                </div>
                <div className="border-t pt-3 flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{getTotalPrice().toFixed(2)} €</span>
                </div>
              </div>

              <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
                Passer la commande
              </button>

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