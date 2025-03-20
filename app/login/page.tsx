"use client"
import React from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, User } from "lucide-react";
import { motion } from "framer-motion";
import { Tilt } from "react-tilt";

export default function LoginPage() {
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
              <CardTitle className="text-3xl font-bold tracking-wider text-gold-400 drop-shadow-md">
                Login
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                {/* Email Field */}
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="Email Address"
                    className="pl-10 bg-transparent border border-gray-600 rounded-lg focus:ring-2 focus:ring-gold-400 focus:border-gold-400 transition duration-300"
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
                    required
                  />
                </div>

                {/* Login Button */}
                <Button className="w-full bg-gold-500 hover:bg-gold-600 transition duration-300 shadow-lg shadow-gold-500/50">
                  Login
                </Button>
              </form>

              {/* Sign Up Redirect */}
              <div className="text-center mt-4 text-gray-400">
                <p>
                  Don’t have an account?{" "}
                  <Link href="/signup" className="text-gold-400 hover:underline">
                    Sign up
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
    </div>
  );
}

