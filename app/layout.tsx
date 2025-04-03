import "./globals.css"
import { Inter, Playfair_Display } from "next/font/google"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import ChatbotWidget from "@/components/ChatbotWidget"
import { ThemeProvider } from "@/components/theme-provider"
import { ToastProvider } from "@/components/ui/use-toast"
import { AuthProvider } from "@/frontend/context/AuthContext"
import type React from "react"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" })

export const metadata = {
  title: "LegalMind - AI-Powered Legal Tech",
  description: "Empowering citizens with AI-driven legal insights and assistance",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} scroll-smooth`} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AuthProvider>
            <ToastProvider>
              <Navbar />
              <main>{children}</main>
              <Footer />
              <ChatbotWidget />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'