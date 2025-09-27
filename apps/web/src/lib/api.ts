// API Client complet

import axios, { AxiosInstance } from 'axios'

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

  async getCategories() {
    const response = await this.client.get('/categories')
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

  // Products
  async createProduct(data: {
    name: string
    description?: string
    shopId: string
    categoryId?: string
    price?: number
    variants?: Array<{
      name: string
      type: string
      value: string
      stockQuantity: number
    }>
  })  
  {
    const response = await this.client.post('/products', data)
    return response.data
  }

  async getProduct(id: string) {
    const response = await this.client.get(`/products/${id}`)
    return response.data
  }

  async getProducts(params?: { search?: string }) {
    const response = await this.client.get('/products', { params })
    return response.data
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

  }

export const apiClient = new ApiClient()
