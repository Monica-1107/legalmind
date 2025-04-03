"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const greetings = [
  "Greetings, Defender of Justice!",
  "Welcome back, Legal Luminary!",
  "Ready to uphold the law, Counselor?",
  "Justice awaits, Legal Eagle!",
]

export function WelcomeInsights({ theme }) {
  const [greeting, setGreeting] = useState("")
  const [currentGreetingIndex, setCurrentGreetingIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentGreetingIndex((prevIndex) => (prevIndex + 1) % greetings.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setGreeting("")
    let i = 0
    const intervalId = setInterval(() => {
      setGreeting(greetings[currentGreetingIndex].slice(0, i))
      i++
      if (i > greetings[currentGreetingIndex].length) {
        clearInterval(intervalId)
      }
    }, 50)

    return () => clearInterval(intervalId)
  }, [currentGreetingIndex])

  return (
    <Card
      className={`bg-black/30 backdrop-blur-md shadow-lg border border-cyan-500/30 ${
        theme === "cyberBlue" ? "text-cyan-300" : theme === "stealthMode" ? "text-orange-300" : "text-emerald-300"
      }`}
    >
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{greeting}</CardTitle>
      </CardHeader>
      <CardContent>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="text-lg font-semibold mb-2">AI Insights</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="relative">
              <svg className="w-full h-32" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={theme === "cyberBlue" ? "#0ff" : theme === "stealthMode" ? "#ff4500" : "#00ff00"}
                  strokeWidth="5"
                  strokeDasharray="283"
                  strokeDashoffset="70"
                />
                <text x="50" y="50" textAnchor="middle" dy=".3em" className="text-2xl font-bold fill-current">
                  75%
                </text>
              </svg>
              <p className="text-center mt-2">Cases Analyzed</p>
            </div>
            <div className="bg-black/50 p-4 rounded-lg border border-cyan-500/30">
              <h4 className="font-semibold mb-2">AI Tip</h4>
              <p className="text-sm">
                "When researching precedents, consider filtering by jurisdiction to narrow down relevant cases more
                effectively."
              </p>
            </div>
            <div className="relative h-32">
              <motion.div
                animate={{ rotateY: 360 }}
                transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <span className="text-lg font-bold">Trending: AI Ethics</span>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </CardContent>
      <div className="px-6 py-2 bg-black/30 text-sm overflow-hidden">
        <motion.div
          animate={{ x: "-100%" }}
          transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          className="whitespace-nowrap"
        >
          Breaking: Supreme Court to hear landmark AI rights case • New cybersecurity laws proposed for legal tech •
          Legal AI assistants show 99% accuracy in recent study
        </motion.div>
      </div>
    </Card>
  )
}

