"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Mic, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function SearchLaws() {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const searchInputRef = useRef(null)

  // Simulated search suggestions
  useEffect(() => {
    if (searchTerm.length > 2) {
      const suggestedTerms = [
        "Criminal Procedure",
        "Civil Rights",
        "Property Law",
        "Contract Law",
        "Tort Law",
        "Constitutional Law",
        "Criminal Law",
        "Family Law",
        "Intellectual Property",
        "Corporate Law",
      ].filter((term) => term.toLowerCase().includes(searchTerm.toLowerCase()))

      setSuggestions(suggestedTerms.slice(0, 5))
    } else {
      setSuggestions([])
    }
  }, [searchTerm])

  const handleSearch = (e) => {
    e.preventDefault()
    if (!searchTerm.trim()) return

    setIsSearching(true)
    setSuggestions([])

    // Simulated search results with delay to show loading state
    setTimeout(() => {
      const dummyResults = [
        {
          id: 1,
          title: "Section 420 of IPC",
          summary: "Cheating and dishonestly inducing delivery of property",
          relevance: 95,
          tags: ["Criminal", "Fraud", "Property"],
        },
        {
          id: 2,
          title: "Article 21 of Constitution",
          summary: "Protection of life and personal liberty",
          relevance: 88,
          tags: ["Constitutional", "Rights", "Liberty"],
        },
        {
          id: 3,
          title: "Section 375 of IPC",
          summary: "Definition of rape",
          relevance: 82,
          tags: ["Criminal", "Sexual Offense"],
        },
      ]
      setSearchResults(dummyResults)
      setIsSearching(false)
    }, 1500)
  }

  const handleVoiceSearch = () => {
    // Check if browser supports speech recognition
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      setIsListening(!isListening)

      if (!isListening) {
        // Simulated voice recognition
        setSearchTerm("")
        const recognitionTimeout = setTimeout(() => {
          setIsListening(false)
          setSearchTerm("intellectual property rights")
          // Auto-submit after voice recognition
          setTimeout(() => {
            handleSearch({ preventDefault: () => {} })
          }, 500)
        }, 3000)

        return () => clearTimeout(recognitionTimeout)
      }
    } else {
      alert("Voice search is not supported in your browser")
    }
  }

  const highlightMatch = (text, term) => {
    if (!term) return text

    const regex = new RegExp(`(${term})`, "gi")
    const parts = text.split(regex)

    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="bg-primary/20 text-primary font-medium">
          {part}
        </span>
      ) : (
        part
      ),
    )
  }

  const selectSuggestion = (suggestion) => {
    setSearchTerm(suggestion)
    setSuggestions([])
    searchInputRef.current?.focus()
  }

  const clearSearch = () => {
    setSearchTerm("")
    setSearchResults([])
    searchInputRef.current?.focus()
  }

  return (
    <div className="min-h-screen py-20 px-4">
      <motion.h1
        className="text-4xl font-playfair text-center mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Search Laws
      </motion.h1>

      <div className="max-w-2xl mx-auto mb-12">
        <form onSubmit={handleSearch} className="relative">
          <div className="relative">
            <Input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search laws, sections, or legal terms..."
              className="w-full p-4 pr-24 rounded-full bg-background border-primary/30 focus:border-primary"
              disabled={isSearching}
            />

            {searchTerm && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-16 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}

            <button
              type="button"
              onClick={handleVoiceSearch}
              className={`absolute right-10 top-1/2 transform -translate-y-1/2 ${isListening ? "text-red-500 animate-pulse" : "text-muted-foreground hover:text-foreground"} transition-colors`}
            >
              <Mic className="h-5 w-5" />
            </button>

            <Button
              type="submit"
              size="icon"
              disabled={isSearching || !searchTerm.trim()}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 rounded-full"
            >
              {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
            </Button>
          </div>

          {/* Autocomplete dropdown */}
          <AnimatePresence>
            {suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute z-10 w-full mt-1 bg-background border border-primary/20 rounded-lg shadow-lg overflow-hidden"
              >
                <ul>
                  {suggestions.map((suggestion, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => selectSuggestion(suggestion)}
                      className="px-4 py-2 cursor-pointer hover:bg-primary/10 transition-colors"
                    >
                      {highlightMatch(suggestion, searchTerm)}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        {isListening && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 p-3 bg-primary/10 rounded-lg text-center"
          >
            <p>Listening... Speak now</p>
          </motion.div>
        )}
      </div>

      <div className="max-w-4xl mx-auto">
        {isSearching ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <AnimatePresence>
            {searchResults.map((result, index) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="mb-6"
              >
                <Card className="overflow-hidden border-primary/20 hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-xl font-semibold mb-2">{highlightMatch(result.title, searchTerm)}</h2>
                        <p className="text-muted-foreground mb-3">{highlightMatch(result.summary, searchTerm)}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {result.tags.map((tag, i) => (
                            <Badge key={i} variant="outline" className="bg-primary/5">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="text-sm font-medium text-primary mb-2">{result.relevance}% match</div>
                        <div className="w-16 h-2 bg-primary/20 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${result.relevance}%` }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="h-full bg-primary"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end space-x-4">
                      <Button variant="ghost" size="sm">
                        Save
                      </Button>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {!isSearching && searchTerm && searchResults.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-10">
            <p className="text-muted-foreground">No results found. Try different keywords.</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}

