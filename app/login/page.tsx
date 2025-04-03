"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, User } from "lucide-react"
import { motion } from "framer-motion"
import { authService } from "@/frontend/services/api"
import { useToast } from "@/components/ui/use-toast"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await authService.login({ email, password })

      toast({
        title: "Success",
        description: "You have been logged in successfully",
      })

      // Redirect to dashboard after successful login
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Login error:", error)

      toast({
        title: "Login Failed",
        description: error.response?.data?.error || "Invalid credentials. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#121212] to-[#1a1a1a] p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="bg-white/10 backdrop-blur-md border border-white/20 shadow-xl shadow-black/40 rounded-2xl text-white transform transition-all hover:shadow-2xl hover:scale-105">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold tracking-wider text-gold-400 drop-shadow-md">Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleLogin}>
              {/* Email Field */}
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="email"
                  placeholder="Email Address"
                  className="pl-10 bg-transparent border border-gray-600 rounded-lg focus:ring-2 focus:ring-gold-400 focus:border-gold-400 transition duration-300"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password Field */}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="password"
                  placeholder="Password"
                  className="pl-10 bg-transparent border border-gray-600 rounded-lg focus:ring-2 focus:ring-gold-400 focus:border-gold-400 transition duration-300"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full bg-gold-500 hover:bg-gold-600 transition duration-300 shadow-lg shadow-gold-500/50"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>

            {/* Sign Up Redirect */}
            <div className="text-center mt-4 text-gray-400">
              <p>
                Don't have an account?{" "}
                <Link href="/signup" className="text-gold-400 hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

