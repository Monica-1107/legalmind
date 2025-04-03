"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Upload, Download, Play } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"

export function CaseAnalysis({ theme }) {
  const [file, setFile] = useState(null)
  const [text, setText] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showResults, setShowResults] = useState(false)

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
  }

  const handleTextChange = (e) => {
    setText(e.target.value)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsProcessing(true)
    setProgress(0)
    setShowResults(false)
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(interval)
          setIsProcessing(false)
          setShowResults(true)
          return 100
        }
        return prevProgress + 10
      })
    }, 500)
  }

  return (
    <Card
      className={`bg-black/30 backdrop-blur-md shadow-lg border border-cyan-500/30 ${
        theme === "cyberBlue" ? "text-cyan-300" : theme === "stealthMode" ? "text-orange-300" : "text-emerald-300"
      }`}
    >
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Case Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="file-upload" className="block text-sm font-medium mb-2">
              Upload Case File (PDF, DOC, TXT)
            </label>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-cyan-500 border-dashed rounded-lg cursor-pointer bg-black/30 hover:bg-cyan-900/30 transition-colors duration-300"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-3 text-cyan-400" />
                  <p className="mb-2 text-sm">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs">PDF, DOC, or TXT (MAX. 10MB)</p>
                </div>
                <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="case-text" className="block text-sm font-medium mb-2">
              Or Enter Case Text
            </label>
            <Textarea
              id="case-text"
              placeholder="Enter or paste case text here..."
              value={text}
              onChange={handleTextChange}
              className="w-full h-32 bg-black/30 border-cyan-500/50 focus:border-cyan-400 focus:ring-cyan-400"
            />
          </div>
          <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white" disabled={isProcessing}>
            {isProcessing ? "Processing..." : "Analyze Case"}
          </Button>
        </form>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-4"
          >
            <Progress value={progress} className="w-full h-2 bg-cyan-900" />
            <p className="text-center mt-2">Analyzing case... {progress}% complete</p>
          </motion.div>
        )}
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-4"
          >
            <h3 className="text-lg font-semibold mb-2">Analysis Results</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Relevant Laws & Articles</h4>
                <ul className="list-disc list-inside">
                  <li>Section 123, XYZ Act</li>
                  <li>Article 45, Constitution</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium">Case Summary</h4>
                <p className="text-sm">This case involves a dispute over intellectual property rights...</p>
              </div>
              <div>
                <h4 className="font-medium">Judgment Prediction</h4>
                <p className="text-sm">70% likelihood of ruling in favor of the plaintiff</p>
              </div>
              <div className="flex space-x-2">
                <Button className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white">
                  <Download className="w-4 h-4 mr-2" />
                  Download Full Report
                </Button>
                <Button className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white">
                  <Play className="w-4 h-4 mr-2" />
                  Generate Voice Summary
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}

