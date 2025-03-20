"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Home, Briefcase, Book, Bookmark, Settings, User } from "lucide-react"
import { Button } from "@/components/ui/button"

const navItems = [
  { name: "Dashboard", icon: Home, href: "/dashboard" },
  { name: "Cases", icon: Briefcase, href: "/dashboard/cases" },
  { name: "Legal Resources", icon: Book, href: "/dashboard/resources" },
  { name: "Saved Queries", icon: Bookmark, href: "/dashboard/saved" },
  { name: "Settings", icon: Settings, href: "/dashboard/settings" },
]

export function TopNavBar({ theme, toggleTheme }) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <nav className="bg-black/50 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-cyan-500/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/dashboard" className="text-2xl font-bold text-cyan-400 flex items-center">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              className="mr-2"
            >
              <span className="text-3xl">⚖</span>
            </motion.div>
            LegalMind
          </Link>
          <div className="flex items-center space-x-4">
            {navItems.map((item) => (
              <motion.div key={item.name} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Link href={item.href} className="text-cyan-300 hover:text-cyan-100 transition-colors duration-200">
                  <item.icon className="w-6 h-6" />
                </Link>
              </motion.div>
            ))}
            <div className="text-cyan-400 font-mono text-sm">{currentTime.toLocaleTimeString()}</div>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="relative group">
              <Button variant="ghost" size="icon" className="rounded-full bg-cyan-900/30">
                <User className="h-5 w-5 text-cyan-300" />
              </Button>
              <div className="absolute right-0 mt-2 w-48 bg-black/80 backdrop-blur-md border border-cyan-500/30 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="p-4">
                  <p className="text-cyan-300 font-semibold">John Doe</p>
                  <p className="text-cyan-400 text-sm">Legal Expert</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </nav>
  )
}

