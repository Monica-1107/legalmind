import { AxiosError } from "axios"
import { toast } from "@/components/ui/use-toast"

interface ApiErrorResponse {
  error?: string
  message?: string
}

export function handleApiError(error: unknown, defaultMessage = "An error occurred"): string {
  console.error("API Error:", error)

  let errorMessage = defaultMessage

  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined

    if (data?.error) {
      errorMessage = data.error
    } else if (data?.message) {
      errorMessage = data.message
    } else if (error.message) {
      errorMessage = error.message
    }

    // Handle specific status codes
    if (error.response?.status === 429) {
      errorMessage = "Too many requests. Please try again later."
    }
  }

  // Show toast notification
  toast({
    title: "Error",
    description: errorMessage,
    variant: "destructive",
  })

  return errorMessage
}

