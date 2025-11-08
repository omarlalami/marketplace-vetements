'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/authStore'
import { apiClient } from '@/lib/api'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('') // ✅ nouveau
  const [loading, setLoading] = useState(false)

  const { login } = useAuthStore()
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    setLoading(true)

    try {
      const data = await apiClient.register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password
      })
      
      //login(data.user, data.token)
      //router.push('/dashboard')

      // ✅ Message de succès après création
      setSuccess("Merci pour votre inscription ! Votre compte est en attente de validation par un administrateur.")
      setFormData({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' })

    } catch (err: any) {
        if (err.response) {
          // Erreur côté serveur avec réponse HTTP (400, 401, 500, etc.)
          if (err.response.status === 400) {
            setError(err.response.data?.error || 'Requête invalide.')
          } else if (err.response.status === 401) {
            setError('Non autorisé. Veuillez vous reconnecter.')
          } else if (err.response.status === 500) {
            setError('Erreur interne du serveur. Réessayez plus tard.')
          } else {
            setError(err.response.data?.error || 'Une erreur est survenue.')
          }
        } else if (err.request) {
          // Aucun réponse du serveur
          setError('Impossible de contacter le serveur. Vérifiez votre connexion.')
        } else {
          // Autre erreur
          setError('Erreur inattendue : ' + err.message)
        }
      }
            finally {
        // ✅ Toujours remis à false, succès ou erreur
        setLoading(false)
      }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Créer un compte</CardTitle>
          <CardDescription>Rejoignez Fashion Market</CardDescription>
        </CardHeader>
        <CardContent>
          {/* ✅ Message de succès */}
          {success ? (
            <div className="text-center space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
                {success}
              </div>
              <p className="text-sm text-gray-600">
                Vous recevrez un email une fois votre compte validé.
              </p>
              <Link href="/login">
                <Button className="w-full mt-4">Retour à la connexion</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                    Prénom
                  </label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="John"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium mb-1">
                    Nom
                  </label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="votre@email.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1">
                  Mot de passe
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                  Confirmer le mot de passe
                </label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Création...' : 'Créer mon compte'}
              </Button>
            </form>
          )}

          {!success && (
            <div className="mt-6 text-center text-sm">
              <p className="text-gray-600">
                Déjà un compte ?{' '}
                <Link href="/login" className="text-primary hover:underline">
                  Se connecter
                </Link>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}