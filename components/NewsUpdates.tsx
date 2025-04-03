"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, ExternalLink } from "lucide-react"

// Simulated news data - in a real app, this would come from an API
const legalNews = [
  {
    id: 1,
    title: "Supreme Court Rules on Major Privacy Case",
    summary:
      "The Supreme Court has issued a landmark ruling on digital privacy rights, affecting how companies can collect and use personal data.",
    date: "2023-11-15",
    source: "Legal Times",
    url: "#",
  },
  {
    id: 2,
    title: "New Amendment to Section 123 of XYZ Act",
    summary:
      "Congress has passed a significant amendment to Section 123 of the XYZ Act, introducing stricter compliance requirements for corporations.",
    date: "2023-11-12",
    source: "Law Journal",
    url: "#",
  },
  {
    id: 3,
    title: "Landmark Decision in Environmental Law Case",
    summary:
      "A federal court has ruled in favor of environmental protections in a case that will set precedent for future climate litigation.",
    date: "2023-11-10",
    source: "Environmental Law Review",
    url: "#",
  },
  {
    id: 4,
    title: "AI Ethics in Legal Practice: New Guidelines Released",
    summary:
      "The Bar Association has released new guidelines for the ethical use of AI in legal practice, addressing concerns about bias and transparency.",
    date: "2023-11-08",
    source: "Tech Law Today",
    url: "#",
  },
  {
    id: 5,
    title: "Major Reforms Proposed for Intellectual Property Rights",
    summary:
      "A new bill proposes significant reforms to intellectual property laws, aiming to balance innovation protection with public access.",
    date: "2023-11-05",
    source: "IP Law Gazette",
    url: "#",
  },
]

export function NewsUpdates() {
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  // Simulate fetching news data
  useEffect(() => {
    setIsLoading(true)
    // Simulate API call delay
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  // Auto-rotate news items
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentNewsIndex((prevIndex) => (prevIndex + 1) % legalNews.length)
    }, 8000)

    return () => clearInterval(interval)
  }, [])

  // Handle manual navigation
  const goToNews = (index) => {
    setCurrentNewsIndex(index)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentNewsIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Card className="overflow-hidden border border-primary/20 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between">
                <div className="md:w-3/4">
                  <h3 className="text-xl font-bold mb-2">{legalNews[currentNewsIndex].title}</h3>
                  <p className="text-muted-foreground mb-4">{legalNews[currentNewsIndex].summary}</p>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span>{legalNews[currentNewsIndex].date}</span>
                    <span className="mx-2">•</span>
                    <span>{legalNews[currentNewsIndex].source}</span>
                  </div>
                </div>
                <div className="md:w-1/4 flex justify-end items-center mt-4 md:mt-0">
                  <a
                    href={legalNews[currentNewsIndex].url}
                    className="flex items-center text-primary hover:text-primary/80 transition-colors"
                  >
                    <span className="mr-1">Read more</span>
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* News navigation dots */}
      <div className="flex justify-center space-x-2 mb-4">
        {legalNews.map((_, index) => (
          <button
            key={index}
            onClick={() => goToNews(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentNewsIndex ? "bg-primary w-4" : "bg-primary/30"
            }`}
            aria-label={`Go to news item ${index + 1}`}
          />
        ))}
      </div>

      {/* News navigation arrows */}
      <div className="flex justify-between">
        <button
          onClick={() => goToNews((currentNewsIndex - 1 + legalNews.length) % legalNews.length)}
          className="p-2 rounded-full bg-background/50 hover:bg-background/80 transition-colors"
          aria-label="Previous news"
        >
          <ArrowRight size={20} className="rotate-180" />
        </button>
        <button
          onClick={() => goToNews((currentNewsIndex + 1) % legalNews.length)}
          className="p-2 rounded-full bg-background/50 hover:bg-background/80 transition-colors"
          aria-label="Next news"
        >
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  )
}

