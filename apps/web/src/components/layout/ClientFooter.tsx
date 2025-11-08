'use client'

import Link from 'next/link'

export function ClientFooter() {
  return (
    <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <h3 className="text-lg font-bold mb-4">Fashion Market</h3>
              <p className="text-gray-400">
                La marketplace qui connecte les créateurs de mode algériens avec leurs clients.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Découvrir</h4>
              <div className="space-y-2">
                <Link href="/shops" className="block text-gray-400 hover:text-white transition-colors">
                  Les marques Algeriennes
                </Link>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Créateurs</h4>
              <div className="space-y-2">
                <Link href="/register" className="block text-gray-400 hover:text-white transition-colors">
                  Rajouter votre Marque
                </Link>
                <Link href="/login" className="block text-gray-400 hover:text-white transition-colors">
                  Se connecter
                </Link>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <div className="space-y-2">
                <a href="/order/track" className="block text-gray-400 hover:text-white transition-colors">
                  Statut de la commande
                </a>
                <a href="/about" className="block text-gray-400 hover:text-white transition-colors">
                  A propos de nous
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Fashion Market. Tous droits réservés.</p>
          </div>
        </div>
      </footer>


  )
}