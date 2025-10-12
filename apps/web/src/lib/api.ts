// API Client complet

import axios, { AxiosInstance } from 'axios'

interface VariantInput {
  id?: string // optionnel pour les nouvelles variantes
  stockQuantity: number
  price: number
  attributes: string[] // on va tester en remplacant string par number
}
class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL,
      withCredentials: true, // indispensable pour envoyer/recevoir cookies
      timeout: 30000,
    })


  // Interceptor to add token from cookie
  this.client.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
      // Parse cookies to get auth-store
      const cookieString = document.cookie
        .split('; ')
        .find((row) => row.startsWith('auth-store='));
      if (cookieString) {
        try {
          const authStore = JSON.parse(cookieString.split('=')[1]);
          const token = authStore.state?.token;
          console.log('🔍 ApiClient - Token from cookie:', token); // Debug log
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('Error parsing auth-store cookie:', error);
        }
      }
      else {
        console.log('🔍 ApiClient - No auth-store cookie found');
      }
    }
    return config;
  })
 
  }

  async register(data: {
    email: string
    password: string
    firstName: string
    lastName: string
  }) {
    const response = await this.client.post('/auth/register', data)
    return response.data
  }

  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password })
    return response.data
  }

  async logout() {
    try {
      const response = await this.client.post('/auth/logout')
      return response.data
    } catch (error) {
      console.error("Erreur lors du logout:", error)
      throw error
    }
  }

  async getCategories() {
    const response = await this.client.get('/categories')
    //console.log(response.data)
    return response.data
  }

  async getProfile() {
    const response = await this.client.get('/auth/profile')
    return response.data
  }

  // Shops
  async createShop(data: { name: string; description?: string }) {
    const response = await this.client.post('/shops', data)
    return response.data
  }

  async getMyShops() {
    const response = await this.client.get('/shops/my-shops')
    return response.data
  }

  async getShop(slug: string) {
    const response = await this.client.get(`/shops/${slug}`)
    return response.data
  }
  
  async getShopForEdit(id: string) {
    const response = await this.client.get(`/shops/edit/${id}`)
    return response.data
  }

  async updateShop(id: string, data: {
    name?: string
    description?: string
    logoUrl?: string
  }) {
    const response = await this.client.put(`/shops/${id}`, data)
    return response.data
  }
  
  async deleteShop(id: string) {
    const response = await this.client.delete(`/shops/${id}`)
    return response.data
  }

  // Route publique pour lister toutes les boutiques
  // tester  ... utiliser dans afficher toute les boutiques
  async getAllShops() {
    const response = await this.client.get('/shops')
    return response.data
  }

  // Products
  async createProduct(data: {
    name: string
    description?: string
    shopId: string
    categoryId?: string
    price?: number
    stockQuantity ?: number
    variants?: Array<{
      stockQuantity: number
      price?: number
      attributeValueIds: string[]
    }>
  }) {
    console.log("create product donne envoyer de l api", JSON.stringify(data, null, 2))

    const response = await this.client.post('/products', data)
    return response.data
  }

  async getProduct(id: string) {
    const response = await this.client.get(`/products/${id}`)
    return response.data
  }

  // Méthode mise à jour pour getProducts avec plus d'options
  // utiliser dans page d'acceuil, page de produits par boutique, page de produits
  async getProducts(params?: { 
    search?: string
    slug?: string
    minPrice?: number
    maxPrice?: number
    shop?: string
    limit?: number
    page?: number
  }) {
    try {
      const response = await this.client.get('/products/public', { params })
      return response.data
    } catch (error: any) {
      console.error('❌ Erreur API getProducts:', error.response?.data || error.message)
      return { ok: false, message: 'Erreur lors du chargement des produits.' }
    }
  }

  async uploadProductImages(productId: string, files: File[]) {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('images', file)
    })
    const response = await this.client.post(
      `/products/${productId}/images`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  }

  //  depuis dashboard\products\page.tsx ProductsPage
  // Récupérer les produits d'une boutique spécifique (pour le dashboard)
  // tester ok
  //a suprimer car ca se repete avec getProducts quiu propose deja de filtrer avec shop_slug
/*   async getShopProducts(shopId: string) {
    const response = await this.client.get(`/products/shop/${shopId}/products`)
    console.log(response.data)
    return response.data
  } */

  //tester ok depuis EditProductPage
  async getProductForEdit(id: string) {
    const response = await this.client.get(`/products/${id}/edit`)
    console.log(response.data)
    return response.data
  }

  // Méthode pour mettre à jour un produit
  //tester ok depuis EditProductPage
  async updateProduct(
    id: string,
    data: {
      name: string
      description?: string
      categoryId?: string
      variants?: VariantInput[] 
    }
  ) {
    console.log("update product donne envoyer de l api", JSON.stringify(data, null, 2))
    const response = await this.client.put(`/products/${id}`, data)
    return response.data
  }

  // tester ok
  async deleteProductImage(productId: string, imageKey: string) {
    //console.log("donne a envoyer depuis api client delete imge product" + productId + "     " + encodeURIComponent(imageKey));
    const response = await this.client.delete(`/products/${productId}/images/${encodeURIComponent(imageKey)}`)
    return response.data
  }

  async deleteProduct(id: string) {
    const response = await this.client.delete(`/products/${id}`)
    return response.data
  }
  
  // Order

  //tester ok depuis Checkoutpage
  async createOrder(payload: {
    items: Array<{
      id: string
      productId: string
      variantId: string
      name: string
      price: number
      quantity: number
      image?: string
      shopName?: string
      shopSlug?: string
      selectedVariants?: Record<string, string>
    }>
    address: {
      firstName: string
      lastName: string
      line: string
      city: string
      postalCode: string
      country: string
      phone: string
      email: string
    }
    total: number
  }) {
    const response = await this.client.post('/orders', payload)
    return response.data as {
      ok: boolean
      message: string
      id: string // global order ID
      order_number: string
      order: {
        id: string
        order_number: string
        subtotal: number
        total_amount: number
        status: string
      }
      shop_orders: Array<{
        id: string
        shop_id: string
        shop_name: string
        subtotal: number
        total_amount: number
        items: Array<{
          id: string
          product_name: string
          quantity: number
          unit_price: number
          subtotal: number
        }>
      }>
    }
  }

  async getMyOrders(params?: { status?: string; limit?: number }) {
    const response = await this.client.get('/orders/my-orders', { params })
    return response.data
  }

  //tester ok depuis ConfirmationOrderPage
  async getOrderById(orderId: string) {
    const response = await this.client.get(`/orders/${orderId}`);
    return response.data;
  }

  // Attrbiutes
  // ⚡ Récupérer les attributs (avec leurs valeurs)
  async getAttributes() {
    const response = await this.client.get('/attributes')
  //  console.log(response.data)
    return response.data
  }

}

export const apiClient = new ApiClient()
