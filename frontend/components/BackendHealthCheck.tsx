"use client"

import { useState, useEffect } from "react"
import { AlertCircle, CheckCircle } from "lucide-react"
import api from "@/frontend/services/api"

export default function BackendHealthCheck() {
  const [status, setStatus] = useState<"loading" | "connected" | "error">("loading")
  const [message, setMessage] = useState<string>("")

  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const response = await api.get("/health")
        if (response.data.status === "ok") {
          setStatus("connected")
          setMessage(response.data.message)
        } else {
          setStatus("error")
          setMessage("Backend is not responding correctly")
        }
      } catch (error) {
        setStatus("error")
        setMessage("Could not connect to backend")
        console.error("Backend health check failed:", error)
      }
    }

    checkBackendHealth()
  }, [])

  if (status === "loading") {
    return (
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
        <span>Checking backend connection...</span>
      </div>
    )
  }

  if (status === "connected") {
    return (
      <div className="flex items-center space-x-2 text-sm text-green-500">
        <CheckCircle className="h-4 w-4" />
        <span>{message}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2 text-sm text-red-500">
      <AlertCircle className="h-4 w-4" />
      <span>{message}</span>
    </div>
  )
}

