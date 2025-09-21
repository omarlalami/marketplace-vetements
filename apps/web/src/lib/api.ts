// API Client simplifié pour test

import axios, { AxiosInstance } from 'axios'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL,
      timeout: 30000,
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
    console.log(response.data)
    return response.data
  }

  async getProducts(params?: { search?: string }) {
    const response = await this.client.get('/products', { params })
    return response.data
  }
}

export const apiClient = new ApiClient()
