import axios from 'axios'

const DEFAULT_API_BASE_URL = 'http://localhost:3000'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL,
  timeout: 300000,
})
