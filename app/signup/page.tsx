import React from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, User, Mail, Phone, Key } from "lucide-react";
import { motion } from "framer-motion";

export default function SignUpPage() {
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
            <CardTitle className="text-3xl font-bold tracking-wider text-gold-400 drop-shadow-md">
              Sign Up
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              {/* Full Name */}
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Full Name"
                  className="pl-10 bg-transparent border border-gray-600 rounded-lg focus:ring-2 focus:ring-gold-400 focus:border-gold-400 transition duration-300"
                  required
                />
              </div>

              {/* Email Address */}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="email"
                  placeholder="Email Address"
                  className="pl-10 bg-transparent border border-gray-600 rounded-lg focus:ring-2 focus:ring-gold-400 focus:border-gold-400 transition duration-300"
                  required
                />
              </div>

              {/* Username */}
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Username"
                  className="pl-10 bg-transparent border border-gray-600 rounded-lg focus:ring-2 focus:ring-gold-400 focus:border-gold-400 transition duration-300"
                  required
                />
              </div>

              {/* Phone Number */}
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="tel"
                  placeholder="Phone Number"
                  className="pl-10 bg-transparent border border-gray-600 rounded-lg focus:ring-2 focus:ring-gold-400 focus:border-gold-400 transition duration-300"
                  required
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="password"
                  placeholder="Password"
                  className="pl-10 bg-transparent border border-gray-600 rounded-lg focus:ring-2 focus:ring-gold-400 focus:border-gold-400 transition duration-300"
                  required
                />
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="password"
                  placeholder="Confirm Password"
                  className="pl-10 bg-transparent border border-gray-600 rounded-lg focus:ring-2 focus:ring-gold-400 focus:border-gold-400 transition duration-300"
                  required
                />
              </div>

              {/* Security Question */}
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  className="w-full pl-10 bg-transparent border border-gray-600 rounded-lg focus:ring-2 focus:ring-gold-400 focus:border-gold-400 transition duration-300 text-gray-400"
                  required
                >
                  <option value="" disabled selected>
                    Select a Security Question
                  </option>
                  <option>What is your mother's maiden name?</option>
                  <option>What was your first pet's name?</option>
                  <option>What is your favorite movie?</option>
                </select>
              </div>

              {/* Security Answer */}
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Security Answer"
                  className="pl-10 bg-transparent border border-gray-600 rounded-lg focus:ring-2 focus:ring-gold-400 focus:border-gold-400 transition duration-300"
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
              <Button className="w-full bg-gold-500 hover:bg-gold-600 transition duration-300 shadow-lg shadow-gold-500/50">
                Sign Up
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
  );
}

