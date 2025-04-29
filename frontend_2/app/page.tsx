"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Upload, Network, MessageSquare, Scale, BarChart4 } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 flex flex-col justify-center items-center pt-24 pb-10">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-gold-500 mb-4 flex items-center justify-center gap-2">
          <span className="text-5xl">⚖</span> Welcome to LegalMind
        </h1>
        <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-6">
          Empowering citizens, lawyers, and organizations with AI-driven legal insights, document analysis, and knowledge graphs. Experience the future of legal tech.
        </p>
        <div className="flex flex-col md:flex-row gap-4 justify-center mt-8">
          <Button asChild className="bg-gold-500 hover:bg-gold-600 text-navy-900 text-lg px-8 py-4 font-semibold shadow-lg">
            <Link href="/upload">
              <Upload className="mr-2 h-5 w-5" /> Upload Document
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-gold-500 text-gold-500 hover:bg-gold-500/10 text-lg px-8 py-4 font-semibold">
            <Link href="/graph">
              <Network className="mr-2 h-5 w-5" /> Explore Knowledge Graph
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-gold-500 text-gold-500 hover:bg-gold-500/10 text-lg px-8 py-4 font-semibold">
            <Link href="/dashboard">
              <MessageSquare className="mr-2 h-5 w-5" /> Start Analysis
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* Feature Highlights */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-8 mt-4"
      >
        <div className="bg-navy-800/60 rounded-xl p-6 border border-gold-500/20 shadow-lg flex flex-col items-center">
          <Scale className="h-10 w-10 text-gold-500 mb-3" />
          <h3 className="text-xl font-semibold text-gold-500 mb-2">AI-Powered Legal Analysis</h3>
          <p className="text-gray-300 text-center">Upload legal documents and receive instant, in-depth AI analysis tailored to your needs.</p>
        </div>
        <div className="bg-navy-800/60 rounded-xl p-6 border border-gold-500/20 shadow-lg flex flex-col items-center">
          <Network className="h-10 w-10 text-gold-500 mb-3" />
          <h3 className="text-xl font-semibold text-gold-500 mb-2">Interactive Knowledge Graphs</h3>
          <p className="text-gray-300 text-center">Visualize relationships, precedents, and legal concepts in a dynamic 3D graph interface.</p>
        </div>
        <div className="bg-navy-800/60 rounded-xl p-6 border border-gold-500/20 shadow-lg flex flex-col items-center">
          <BarChart4 className="h-10 w-10 text-gold-500 mb-3" />
          <h3 className="text-xl font-semibold text-gold-500 mb-2">Advanced Scenario Tools</h3>
          <p className="text-gray-300 text-center">Build hypothetical cases, run hierarchical analyses, and explore legal outcomes with ease.</p>
        </div>
      </motion.div>
    </div>
  )
} 