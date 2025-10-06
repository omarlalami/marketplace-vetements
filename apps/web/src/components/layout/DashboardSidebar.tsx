'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Store,
  Package,
  Plus,
  Settings,
  BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const navigation = [
  { name: 'Accueil', href: '/dashboard', icon: Home },
  { name: 'Mes boutiques', href: '/dashboard/shops', icon: Store },
  { name: 'Produits', href: '/dashboard/products', icon: Package },
/*   { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Paramètres', href: '/dashboard/settings', icon: Settings }, */
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white border-r min-h-[calc(100vh-4rem)]">
      <div className="p-6">
        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}