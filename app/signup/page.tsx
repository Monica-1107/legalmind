"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, User, Mail } from "lucide-react"
import { motion } from "framer-motion"
import { authService } from "@/frontend/services/api"
import { useToast } from "@/components/ui/use-toast"

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    last_name: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!formData.email || !formData.password || !formData.first_name) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Register the user
      await authService.register({
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
      })

      toast({
        title: "Success",
        description: "Account created successfully! Please log in.",
      })

      // Redirect to login page
      router.push("/login")
    } catch (error: any) {
      console.error("Registration error:", error)

      toast({
        title: "Registration Failed",
        description: error.response?.data?.error || "Could not create account. Please try again.",
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
        <Card className="bg-white/10 backdrop-blur-md border border-white/20 shadow-lg rounded-2xl text-white">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold tracking-wider text-gold-400 drop-shadow-md">Sign Up</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* First Name */}
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  name="first_name"
                  placeholder="First Name"
                  className="pl-10 bg-transparent border border-gray-600 rounded-lg focus:ring-2 focus:ring-gold-400 focus:border-gold-400 transition duration-300"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Last Name */}
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  name="last_name"
                  placeholder="Last Name"
                  className="pl-10 bg-transparent border border-gray-600 rounded-lg focus:ring-2 focus:ring-gold-400 focus:border-gold-400 transition duration-300"
                  value={formData.last_name}
                  onChange={handleChange}
                />
              </div>

              {/* Email Address */}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  className="pl-10 bg-transparent border border-gray-600 rounded-lg focus:ring-2 focus:ring-gold-400 focus:border-gold-400 transition duration-300"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="password"
                  name="password"
                  placeholder="Password"
                  className="pl-10 bg-transparent border border-gray-600 rounded-lg focus:ring-2 focus:ring-gold-400 focus:border-gold-400 transition duration-300"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  className="pl-10 bg-transparent border border-gray-600 rounded-lg focus:ring-2 focus:ring-gold-400 focus:border-gold-400 transition duration-300"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Terms & Conditions Checkbox */}
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="terms" required />
                <label htmlFor="terms" className="text-gray-400">
                  I agree to the{" "}
                  <Link href="/terms" className="text-gold-400 hover:underline">
                    Terms & Conditions
                  </Link>
                </label>
              </div>

              {/* Sign Up Button */}
              <Button
                type="submit"
                className="w-full bg-gold-500 hover:bg-gold-600 transition duration-300 shadow-lg shadow-gold-500/50"
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Sign Up"}
              </Button>
            </form>

            {/* Login Redirect */}
            <div className="text-center mt-4 text-gray-400">
              <p>
                Already have an account?{" "}
                <Link href="/login" className="text-gold-400 hover:underline">
                  Login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

