"use client"

import { useState } from "react"
import { Search, Mic, Book, Scale, FileText, Gavel } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export function LegalSearch({ theme }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isListening, setIsListening] = useState(false)

  const handleSearch = (e) => {
    e.preventDefault()
    // Implement search functionality
    console.log("Searching for:", searchTerm)
  }

  const handleVoiceSearch = () => {
    setIsListening(!isListening)
    // Implement voice search functionality
  }

  return (
    <Card
      className={`bg-black/30 backdrop-blur-md shadow-lg border border-cyan-500/30 ${
        theme === "cyberBlue" ? "text-cyan-300" : theme === "stealthMode" ? "text-orange-300" : "text-emerald-300"
      }`}
    >
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Legal Research</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="flex items-center space-x-2">
          <div className="relative flex-grow">
            <Input
              type="text"
              placeholder="Search legal statutes, precedents, case laws..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 bg-black/50 border-cyan-500/50 focus:border-cyan-400 focus:ring-cyan-400 text-cyan-100 placeholder-cyan-500"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-500" />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 transform -translate-y-1/2"
              onClick={handleVoiceSearch}
            >
              <Mic className={`h-4 w-4 ${isListening ? "text-red-500" : "text-cyan-500"}`} />
            </Button>
          </div>
          <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white">
            Search
          </Button>
        </form>
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Quick Access</h3>
          <div className="grid grid-cols-2 gap-2">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="outline" className="w-full justify-start border-cyan-500/50 hover:bg-cyan-900/30">
                <Book className="w-4 h-4 mr-2" />
                Legal Dictionary
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="outline" className="w-full justify-start border-cyan-500/50 hover:bg-cyan-900/30">
                <Scale className="w-4 h-4 mr-2" />
                Case Law Database
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="outline" className="w-full justify-start border-cyan-500/50 hover:bg-cyan-900/30">
                <FileText className="w-4 h-4 mr-2" />
                Statutes
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="outline" className="w-full justify-start border-cyan-500/50 hover:bg-cyan-900/30">
                <Gavel className="w-4 h-4 mr-2" />
                Recent Judgments
              </Button>
            </motion.div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

