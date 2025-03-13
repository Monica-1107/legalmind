"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Typewriter } from "@/components/Typewriter"
import { NewsUpdates } from "@/components/NewsUpdates"

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("")
  const [suggestions, setSuggestions] = useState([])

  useEffect(() => {
    if (searchTerm) {
      // Simulated AI-powered suggestions
      const dummySuggestions = [
        "Contract Law",
        "Criminal Procedure",
        "Intellectual Property Rights",
        "Family Law",
        "Corporate Law",
      ].filter((s) => s.toLowerCase().includes(searchTerm.toLowerCase()))
      setSuggestions(dummySuggestions)
    } else {
      setSuggestions([])
    }
  }, [searchTerm])

  return (
    <div className="min-h-screen">
      <section className="h-screen flex flex-col justify-center items-center relative overflow-hidden">
        <motion.h1
          className="text-5xl md:text-7xl font-playfair text-center mb-8"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            Transforming Legal Understanding
          </span>
        </motion.h1>
        <motion.div
          className="text-3xl md:text-4xl text-center mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <Typewriter
            texts={["with AI-Powered Insights", "through Intelligent Analysis", "via Advanced Legal Tech"]}
            delay={100}
            loop
          />
        </motion.div>
        <motion.div
          className="w-full max-w-2xl relative"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search laws, sections, or legal terms..."
            className="w-full p-4 pr-12 rounded-full bg-background/50 backdrop-blur-md border-primary/50 focus:border-primary"
          />
          <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <AnimatePresence>
            {suggestions.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute w-full mt-2 bg-background/80 backdrop-blur-md rounded-lg shadow-lg z-10"
              >
                {suggestions.map((suggestion, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-2 hover:bg-primary/10 cursor-pointer"
                  >
                    {suggestion}
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </motion.div>
        <motion.div
          className="mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <Button asChild size="lg" className="rounded-full">
            <Link href="/upload">Upload a Case</Link>
          </Button>
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-playfair text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                title: "Search",
                description: "Enter legal terms, sections, or case laws to get instant insights powered by AI.",
              },
              {
                title: "Upload",
                description: "Upload case files or legal documents, and let AI analyze key points for you.",
              },
              {
                title: "Chat",
                description: "Engage in an AI-powered conversation to clarify legal doubts and get expert suggestions.",
              },
              {
                title: "Visualize",
                description: "View case summaries, citations, and legal references in an interactive format.",
              },
            ].map((step, index) => (
              <motion.div
                key={step.title}
                className="text-center"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">{index + 1}</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Legal Updates Section - Replacing the news ticker */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-playfair text-center mb-8">Latest Legal Updates</h2>
          <NewsUpdates />
        </div>
      </section>
    </div>
  )
}

