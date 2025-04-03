import axios from "axios"
import { handleApiError } from "@/frontend/utils/error-handler"

// Create axios instance with base URL and default headers
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
})

// Add request interceptor to include auth token in headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors (expired or invalid token)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      // Redirect to login page if not already there
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  },
)

// Auth services
export const authService = {
  register: async (userData: any) => {
    try {
      const response = await api.post("/register", userData)
      return response.data
    } catch (error) {
      handleApiError(error, "Registration failed")
      throw error
    }
  },

  login: async (credentials: { email: string; password: string }) => {
    try {
      const response = await api.post("/login", credentials)
      if (response.data.token) {
        localStorage.setItem("token", response.data.token)
        localStorage.setItem("user", JSON.stringify(response.data.user))
      }
      return response.data
    } catch (error) {
      handleApiError(error, "Login failed")
      throw error
    }
  },

  logout: async () => {
    try {
      await api.post("/logout")
    } catch (error) {
      handleApiError(error, "Logout failed")
    } finally {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
    }
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem("user")
    if (userStr) {
      return JSON.parse(userStr)
    }
    return null
  },
}

// User services
export const userService = {
  getProfile: async () => {
    try {
      const response = await api.get("/user")
      return response.data
    } catch (error) {
      handleApiError(error, "Failed to fetch user profile")
      throw error
    }
  },

  updateProfile: async (userData: any) => {
    try {
      const response = await api.put("/user/update", userData)
      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user))
      }
      return response.data
    } catch (error) {
      handleApiError(error, "Failed to update profile")
      throw error
    }
  },
}

export default api

