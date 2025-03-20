"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { TopNavBar } from "@/components/dashboard/TopNavBar"
import { WelcomeInsights } from "@/components/dashboard/WelcomeInsights"
import { CaseAnalysis } from "@/components/dashboard/CaseAnalysis"
import { LegalSearch } from "@/components/dashboard/LegalSearch"
import { SavedCases } from "@/components/dashboard/SavedCases"
import { UserProfile } from "@/components/dashboard/UserProfile"
import { Notifications } from "@/components/dashboard/Notifications"

export default function Dashboard() {
  const [theme, setTheme] = useState<"cyberBlue" | "stealthMode" | "emeraldLaw">("cyberBlue")

  const toggleTheme = (newTheme: "cyberBlue" | "stealthMode" | "emeraldLaw") => {
    setTheme(newTheme)
  }

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${
        theme === "cyberBlue"
          ? "from-blue-900 to-black"
          : theme === "stealthMode"
            ? "from-gray-900 to-black"
            : "from-green-900 to-black"
      } text-cyan-300`}
    >
      <div className="fixed inset-0 bg-cyberpunk-city bg-cover bg-center opacity-10 pointer-events-none" />
      <TopNavBar theme={theme} toggleTheme={toggleTheme} />
      <main className="container mx-auto px-4 py-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <WelcomeInsights theme={theme} />
              <CaseAnalysis theme={theme} />
              <LegalSearch theme={theme} />
            </div>
            <div className="space-y-8">
              <SavedCases theme={theme} />
              <UserProfile theme={theme} />
            </div>
          </div>
        </motion.div>
      </main>
      <Notifications theme={theme} />
    </div>
  )
}

