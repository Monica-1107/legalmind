"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Search, Upload, Network, User, Menu, X, LogOut } from "lucide-react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/frontend/context/AuthContext"

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { user, isAuthenticated, logout } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const breadcrumbs = pathname.split("/").filter(Boolean)

  // Define nav items based on authentication status
  const navItems = [
    { name: "Search Laws", href: "/search", icon: Search },
    { name: "Upload Case", href: "/upload", icon: Upload },
    { name: "Knowledge Graph", href: "/graph", icon: Network },
  ]

  // Add authentication-related nav items
  const authNavItems = isAuthenticated
    ? [
        { name: "Dashboard", href: "/dashboard", icon: User },
        { name: "Logout", href: "#", icon: LogOut, onClick: logout },
      ]
    : [{ name: "Login", href: "/login", icon: User }]

  const allNavItems = [...navItems, ...authNavItems]

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-background/80 backdrop-blur-md shadow-lg" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-2xl font-bold text-primary">
            LegalMind
          </Link>

          {/* Desktop Menu - Improved spacing and alignment */}
          <div className="hidden md:flex items-center justify-center space-x-6">
            {allNavItems.map((item) => (
              <motion.div key={item.name} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                {item.onClick ? (
                  <button
                    onClick={item.onClick}
                    className="flex items-center space-x-1 text-sm font-medium hover:text-primary transition-colors"
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className="flex items-center space-x-1 text-sm font-medium hover:text-primary transition-colors"
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                )}
              </motion.div>
            ))}
            <ThemeToggle />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <ThemeToggle />
            <Button variant="ghost" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {/* Breadcrumbs */}
        <div className="py-2 text-sm">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          {breadcrumbs.map((crumb, index) => (
            <span key={index}>
              {" "}
              /{" "}
              <Link
                href={`/${breadcrumbs.slice(0, index + 1).join("/")}`}
                className="hover:text-primary transition-colors"
              >
                {crumb}
              </Link>
            </span>
          ))}
        </div>
      </div>

      {/* Mobile Menu with improved animations */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="md:hidden bg-background/80 backdrop-blur-md shadow-lg"
        >
          <div className="container mx-auto px-4 py-4">
            {allNavItems.map((item) => (
              <motion.div key={item.name} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                {item.onClick ? (
                  <button
                    onClick={() => {
                      item.onClick()
                      setIsMobileMenuOpen(false)
                    }}
                    className="flex items-center space-x-2 py-2 hover:text-primary transition-colors w-full text-left"
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className="flex items-center space-x-2 py-2 hover:text-primary transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </nav>
  )
}

