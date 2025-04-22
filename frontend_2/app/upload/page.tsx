"use client"

import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, FileText, X, CheckCircle, AlertCircle, File, Send, Loader2, MessageSquare, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { useChat } from "ai/react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { uploadDocument, analyzeDocument, chatWithDocument } from "@/lib/api"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function CaseDocumentAnalysis() {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [uploadStatus, setUploadStatus] = useState<Record<string, string>>({})
  const [documentUploaded, setDocumentUploaded] = useState(false)
  const [analysisMode, setAnalysisMode] = useState<"standard" | "hypothetical" | "hierarchical">("standard")
  const [analysisLevel, setAnalysisLevel] = useState<1 | 2 | 3>(1)
  const [hypotheticalScenario, setHypotheticalScenario] = useState({
    facts: "",
    arguments: "",
    precedents: "",
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<string | null>(null)
  const [uploadedDocument, setUploadedDocument] = useState<File | null>(null)
  const [token, setToken] = useState<string>("")
  const [docId, setDocId] = useState<string>("")
  const [sessionId, setSessionId] = useState<string>("")
  const [activeMode, setActiveMode] = useState<"document" | "chat">("document") 

  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const { messages, input, handleInputChange, handleSubmit, append } = useChat({
    onFinish: (message) => {
      if (isAnalyzing) {
        setAnalysisResult(message.content)
        setIsAnalyzing(false)
      }
    },
  })

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    setToken(localStorage.getItem("token") || "")
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return

    const selectedFiles = Array.from(e.target.files)
    setFiles((prevFiles) => [...prevFiles, ...selectedFiles])

    // Initialize progress and status for each file
    const newProgress = { ...uploadProgress }
    const newStatus = { ...uploadStatus }

    selectedFiles.forEach((file) => {
      newProgress[file.name] = 0
      newStatus[file.name] = "pending"
    })

    setUploadProgress(newProgress)
    setUploadStatus(newStatus)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()

    if (e.dataTransfer.files) {
      const droppedFiles = Array.from(e.dataTransfer.files)
      setFiles((prevFiles) => [...prevFiles, ...droppedFiles])

      // Initialize progress and status for each file
      const newProgress = { ...uploadProgress }
      const newStatus = { ...uploadStatus }

      droppedFiles.forEach((file) => {
        newProgress[file.name] = 0
        newStatus[file.name] = "pending"
      })

      setUploadProgress(newProgress)
      setUploadStatus(newStatus)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const removeFile = (fileName: string) => {
    setFiles(files.filter((file) => file.name !== fileName))

    // Remove from progress and status
    const newProgress = { ...uploadProgress }
    const newStatus = { ...uploadStatus }
    delete newProgress[fileName]
    delete newStatus[fileName]

    setUploadProgress(newProgress)
    setUploadStatus(newStatus)
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (files.length === 0) return
    setUploading(true)
    for (const file of files) {
      setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }))
      setUploadStatus((prev) => ({ ...prev, [file.name]: "pending" }))
      try {
        const res = await uploadDocument(file, token)
        setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }))
        setUploadStatus((prev) => ({ ...prev, [file.name]: "success" }))
        toast({ title: "File uploaded successfully", description: `${file.name} has been uploaded.`, variant: "default" })
        setDocumentUploaded(true)
        setUploadedDocument(file)
        setDocId(res.document?._id || res.document?.id || "")
      } catch (err: any) {
        setUploadStatus((prev) => ({ ...prev, [file.name]: "error" }))
        toast({ title: "Upload failed", description: file.name + " could not be uploaded", variant: "destructive" })
      }
    }
    setUploading(false)
  }

  const handleAnalyzeDocument = async () => {
    if (!uploadedDocument || !docId) return
    setIsAnalyzing(true)
    try {
      const data: any = { analysis_mode: analysisMode, analysis_level: analysisLevel }
      if (analysisMode === "hypothetical") {
        data.content = JSON.stringify(hypotheticalScenario)
      }
      
      const res = await analyzeDocument(docId, data, token)
      const result = res.analysis || res.document?.analysis || JSON.stringify(res)
      setAnalysisResult(result.content)
      append({ role: "assistant", content: result.content })
    } catch (error: any) {
      setAnalysisResult("Error analyzing document: " + error.message)
      append({ role: "assistant", content: "Error analyzing document: " + error.message })
    }
    setIsAnalyzing(false)
  }

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !docId) return
    append({ role: "user", content: input })
    try {
      const res = await chatWithDocument({ 
        message: input, 
        document_id: docId, 
        session_id: sessionId,
        mode: analysisMode 
      }, token)
      const aiMsg = res.response?.content || res.message || JSON.stringify(res)
      append({ role: "assistant", content: aiMsg })
    } catch (error: any) {
      append({ role: "assistant", content: "Error: " + error.message })
    }
    handleInputChange({ target: { value: "" } } as any)
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase() || ""

    switch (extension) {
      case "pdf":
        return <File className="text-red-500" />
      case "doc":
      case "docx":
        return <File className="text-blue-500" />
      case "txt":
        return <FileText className="text-gray-400" />
      default:
        return <FileText className="text-gray-400" />
    }
  }

  // Initial upload view before document is uploaded
  const renderUploadView = () => (
    <div className="min-h-screen py-12 px-4">
      <motion.h1
        className="text-3xl font-bold text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Case Document Analysis
      </motion.h1>

      <div className="max-w-3xl mx-auto">
        <Card className="border border-primary/20 shadow-lg">
          <CardContent className="p-6">
            <div className="mb-6" onDrop={handleDrop} onDragOver={handleDragOver}>
              <label htmlFor="file-upload" className="block text-sm font-medium mb-2">
                Upload your case documents (PDF, DOCX, or TXT)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-primary/30 rounded-md hover:border-primary/50 transition-colors">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-primary/50" />
                  <div className="flex text-sm justify-center">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary"
                    >
                      <span>Choose files</span>
                      <input
                        id="file-upload"
                        ref={fileInputRef}
                        name="file-upload"
                        type="file"
                        multiple
                        className="sr-only"
                        onChange={handleFileChange}
                        disabled={uploading}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-muted-foreground">PDF, DOCX, or TXT up to 10MB each</p>
                </div>
              </div>
            </div>

            {/* File list */}
            <AnimatePresence>
              {files.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 overflow-hidden"
                >
                  <h3 className="text-lg font-semibold mb-2">Selected Files ({files.length})</h3>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {files.map((file, index) => (
                      <motion.div
                        key={file.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-primary/10"
                      >
                        <div className="flex items-center">
                          {getFileIcon(file.name)}
                          <div className="ml-3">
                            <p className="text-sm font-medium truncate max-w-xs">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>

                        <div className="flex items-center">
                          {uploadStatus[file.name] === "success" && (
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          )}
                          {uploadStatus[file.name] === "error" && (
                            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                          )}

                          {uploading && uploadStatus[file.name] === "pending" ? (
                            <div className="w-20 mr-2">
                              <Progress value={uploadProgress[file.name]} className="h-1" />
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => removeFile(file.name)}
                              disabled={uploading}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <Button
                type="button"
                onClick={handleUpload}
                disabled={files.length === 0 || uploading}
                className="w-full"
              >
                {uploading ? "Uploading..." : "Upload and Analyze"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // Claude-like interface after document is uploaded
  const renderAnalysisView = () => (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header with breadcrumb, title, and mode selector */}
      <header className="border-b bg-background py-10 px-6">
        {/* <div className="flex justify-between items-center max-w-6xl mx-auto">
          <div className="text-sm breadcrumbs">
            <ul className="flex space-x-2">
              <li>
                <a href="/" className="hover:text-primary">Home</a> /
              </li>
              <li>upload</li>
            </ul>
          </div>
          
          <h1 className="text-2xl font-bold text-center">Case Document Analysis</h1>
          
        </div> */}
      </header>

      {/* Main content area */}
      <main className="flex flex-1 overflow-hidden">
        {/* Left sidebar - File info and analysis options */}
        <div className="w-72 border-r p-4 overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-primary/10">
              <div className="flex items-center">
                {getFileIcon(uploadedDocument?.name || "")}
                <div className="ml-3">
                  <h3 className="text-sm font-semibold truncate">{uploadedDocument?.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {uploadedDocument && (uploadedDocument.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-md font-semibold mb-3">Analysis Options</h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Analysis Mode:</label>
                  <select
                    className="w-full p-2 rounded bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary"
                    value={analysisMode}
                    onChange={(e) => setAnalysisMode(e.target.value as any)}
                  >
                    <option value="standard">Standard Analysis</option>
                    <option value="hypothetical">Hypothetical Scenario Builder</option>
                    <option value="hierarchical">Hierarchical Analysis</option>
                  </select>
                </div>

                {analysisMode === "hypothetical" && (
                  <div className="space-y-3 bg-muted/50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm">Modify Scenario Elements:</h4>
                    <div>
                      <label className="text-xs text-muted-foreground">Modified Facts:</label>
                      <Textarea
                        placeholder="Describe modified facts..."
                        className="mt-1 w-full bg-background border-input text-sm"
                        value={hypotheticalScenario.facts}
                        onChange={(e) =>
                          setHypotheticalScenario({ ...hypotheticalScenario, facts: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Modified Arguments:</label>
                      <Textarea
                        placeholder="Describe modified arguments..."
                        className="mt-1 w-full bg-background border-input text-sm"
                        value={hypotheticalScenario.arguments}
                        onChange={(e) =>
                          setHypotheticalScenario({ ...hypotheticalScenario, arguments: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Modified Precedents:</label>
                      <Textarea
                        placeholder="Describe modified precedents..."
                        className="mt-1 w-full bg-background border-input text-sm"
                        value={hypotheticalScenario.precedents}
                        onChange={(e) =>
                          setHypotheticalScenario({ ...hypotheticalScenario, precedents: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}

                {analysisMode === "hierarchical" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Analysis Level:</label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={analysisLevel === 1 ? "default" : "outline"}
                        onClick={() => setAnalysisLevel(1)}
                        className="flex-1"
                        size="sm"
                      >
                        L1
                      </Button>
                      <Button
                        variant={analysisLevel === 2 ? "default" : "outline"}
                        onClick={() => setAnalysisLevel(2)}
                        className="flex-1"
                        size="sm"
                      >
                        L2
                      </Button>
                      <Button
                        variant={analysisLevel === 3 ? "default" : "outline"}
                        onClick={() => setAnalysisLevel(3)}
                        className="flex-1"
                        size="sm"
                      >
                        L3
                      </Button>
                    </div>
                  </div>
                )}

                <Button onClick={handleAnalyzeDocument} className="w-full" disabled={isAnalyzing}>
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Analyze Document"
                  )}
                </Button>
              </div>
            </div>

            <div className="pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setDocumentUploaded(false)
                  setUploadedDocument(null)
                  setFiles([])
                  setUploadProgress({})
                  setUploadStatus({})
                  setAnalysisResult(null)
                }}
                className="w-full"
              >
                Upload Different Document
              </Button>
            </div>
            <div className="pt-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 min-w-32">
                {activeMode === "document" ? "Document Analysis" : "Chat"}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setActiveMode("document")}>
                Document Analysis
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveMode("chat")}>
                Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu></div>
          </div>
        </div>

        {/* Main content area - Document Analysis or Chat */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Document Analysis View */}
          {activeMode === "document" && (
            <div className="flex-1 overflow-y-auto p-6">
              {!analysisResult ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <FileText className="h-16 w-16 mb-4 opacity-30" />
                  <h3 className="text-lg font-medium mb-2">No Analysis Yet</h3>
                  <p>Select analysis options and click "Analyze Document" to see results.</p>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <div
                    className="whitespace-pre-line"
                    dangerouslySetInnerHTML={{ __html: analysisResult?.replace(/\n/g, "<br />") }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Chat View */}
          {activeMode === "chat" && (
            <>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <MessageSquare className="h-16 w-16 mb-4 opacity-30" />
                    <h3 className="text-lg font-medium mb-2">No Messages Yet</h3>
                    <p>Ask questions about the document or request additional analysis.</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className={`${message.role === "user" ? "text-right" : "text-left"}`}>
                      <span
                        className={`inline-block p-3 rounded-lg max-w-[80%] ${
                          message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        {message.content}
                      </span>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleChatSubmit} className="p-4 border-t mt-auto">
                <div className="relative">
                  <Textarea
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Ask about the document or request further analysis..."
                    className="w-full p-2 pr-10 rounded bg-background border-input resize-none"
                    rows={2}
                  />
                  <Button type="submit" size="icon" className="absolute right-2 bottom-2 rounded-full">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  )

  return documentUploaded ? renderAnalysisView() : renderUploadView()
}
// "use client"

// import React, { useState, useRef, useEffect } from "react"
// import { motion, AnimatePresence } from "framer-motion"
// import { Upload, FileText, X, CheckCircle, AlertCircle, File, Send, Loader2, MessageSquare } from "lucide-react"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent } from "@/components/ui/card"
// import { Progress } from "@/components/ui/progress"
// import { useToast } from "@/components/ui/use-toast"
// import { Textarea } from "@/components/ui/textarea"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { useChat } from "ai/react"
// import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
// import { uploadDocument, analyzeDocument, chatWithDocument } from "@/lib/api"

// export default function CaseDocumentAnalysis() {
//   const [files, setFiles] = useState<File[]>([])
//   const [uploading, setUploading] = useState(false)
//   const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
//   const [uploadStatus, setUploadStatus] = useState<Record<string, string>>({})
//   const [documentUploaded, setDocumentUploaded] = useState(false)
//   const [analysisMode, setAnalysisMode] = useState<"standard" | "hypothetical" | "hierarchical">("standard")
//   const [analysisLevel, setAnalysisLevel] = useState<1 | 2 | 3>(1)
//   const [hypotheticalScenario, setHypotheticalScenario] = useState({
//     facts: "",
//     arguments: "",
//     precedents: "",
//   })
//   const [isAnalyzing, setIsAnalyzing] = useState(false)
//   const [analysisResult, setAnalysisResult] = useState<string | null>(null)
//   const [uploadedDocument, setUploadedDocument] = useState<File | null>(null)
//   const [token, setToken] = useState<string>("")
//   const [docId, setDocId] = useState<string>("")
//   const [sessionId, setSessionId] = useState<string>("")
//   const [activeTab, setActiveTab] = useState("document") // "document" or "chat"

//   const fileInputRef = useRef<HTMLInputElement>(null)
//   const messagesEndRef = useRef<HTMLDivElement>(null)
//   const { toast } = useToast()

//   const { messages, input, handleInputChange, handleSubmit, append } = useChat({
//     onFinish: (message) => {
//       if (isAnalyzing) {
//         setAnalysisResult(message.content)
//         setIsAnalyzing(false)
//       }
//     },
//   })

//   // Scroll to bottom of chat when messages change
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
//   }, [messages])

//   useEffect(() => {
//     setToken(localStorage.getItem("token") || "")
//   }, [])

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (!e.target.files) return

//     const selectedFiles = Array.from(e.target.files)
//     setFiles((prevFiles) => [...prevFiles, ...selectedFiles])

//     // Initialize progress and status for each file
//     const newProgress = { ...uploadProgress }
//     const newStatus = { ...uploadStatus }

//     selectedFiles.forEach((file) => {
//       newProgress[file.name] = 0
//       newStatus[file.name] = "pending"
//     })

//     setUploadProgress(newProgress)
//     setUploadStatus(newStatus)
//   }

//   const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault()

//     if (e.dataTransfer.files) {
//       const droppedFiles = Array.from(e.dataTransfer.files)
//       setFiles((prevFiles) => [...prevFiles, ...droppedFiles])

//       // Initialize progress and status for each file
//       const newProgress = { ...uploadProgress }
//       const newStatus = { ...uploadStatus }

//       droppedFiles.forEach((file) => {
//         newProgress[file.name] = 0
//         newStatus[file.name] = "pending"
//       })

//       setUploadProgress(newProgress)
//       setUploadStatus(newStatus)
//     }
//   }

//   const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault()
//   }

//   const removeFile = (fileName: string) => {
//     setFiles(files.filter((file) => file.name !== fileName))

//     // Remove from progress and status
//     const newProgress = { ...uploadProgress }
//     const newStatus = { ...uploadStatus }
//     delete newProgress[fileName]
//     delete newStatus[fileName]

//     setUploadProgress(newProgress)
//     setUploadStatus(newStatus)
//   }

//   const handleUpload = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (files.length === 0) return
//     setUploading(true)
//     for (const file of files) {
//       setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }))
//       setUploadStatus((prev) => ({ ...prev, [file.name]: "pending" }))
//       try {
//         const res = await uploadDocument(file, token)
//         setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }))
//         setUploadStatus((prev) => ({ ...prev, [file.name]: "success" }))
//         toast({ title: "File uploaded successfully", description: `${file.name} has been uploaded.`, variant: "default" })
//         setDocumentUploaded(true)
//         setUploadedDocument(file)
//         setDocId(res.document?._id || res.document?.id || "")
//       } catch (err: any) {
//         setUploadStatus((prev) => ({ ...prev, [file.name]: "error" }))
//         toast({ title: "Upload failed", description: file.name + " could not be uploaded", variant: "destructive" })
//       }
//     }
//     setUploading(false)
//   }

//   const handleAnalyzeDocument = async () => {
//     if (!uploadedDocument || !docId) return
//     setIsAnalyzing(true)
//     try {
//       const data: any = { analysis_mode: analysisMode, analysis_level: analysisLevel }
//       if (analysisMode === "hypothetical") {
//         data.content = JSON.stringify(hypotheticalScenario)
//       }
      
//       const res = await analyzeDocument(docId, data, token)
//       const result = res.analysis || res.document?.analysis || JSON.stringify(res)
//       setAnalysisResult(result.content)
//       append({ role: "assistant", content: result.content })
//     } catch (error: any) {
//       setAnalysisResult("Error analyzing document: " + error.message)
//       append({ role: "assistant", content: "Error analyzing document: " + error.message })
//     }
//     setIsAnalyzing(false)
//   }

//   const handleChatSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (!input.trim() || !docId) return
//     append({ role: "user", content: input })
//     try {
//       const res = await chatWithDocument({ 
//         message: input, 
//         document_id: docId, 
//         session_id: sessionId,
//         mode: analysisMode 
//       }, token)
//       const aiMsg = res.response?.content || res.message || JSON.stringify(res)
//       append({ role: "assistant", content: aiMsg })
//     } catch (error: any) {
//       append({ role: "assistant", content: "Error: " + error.message })
//     }
//     handleInputChange({ target: { value: "" } } as any)
//   }

//   const getFileIcon = (fileName: string) => {
//     const extension = fileName.split(".").pop()?.toLowerCase() || ""

//     switch (extension) {
//       case "pdf":
//         return <File className="text-red-500" />
//       case "doc":
//       case "docx":
//         return <File className="text-blue-500" />
//       case "txt":
//         return <FileText className="text-gray-400" />
//       default:
//         return <FileText className="text-gray-400" />
//     }
//   }

//   return (
//     <div className="flex flex-col min-h-screen bg-background">
//       {/* Header with breadcrumb and title */}
//       <header className="border-b bg-background py-4 px-6">
//         <div className="flex justify-between items-center max-w-7xl mx-auto">
//           <div className="text-sm breadcrumbs">
//             <ul className="flex space-x-2">
//               <li>
//                 <a href="/" className="hover:text-primary">Home</a> /
//               </li>
//               <li>upload</li>
//             </ul>
//           </div>
//           <h1 className="text-2xl font-bold text-center">Case Document Analysis</h1>
//           <div className="w-24"></div> {/* Spacer for centering */}
//         </div>
//       </header>

//       {/* Main content */}
//       <main className="flex-1 py-6 px-4 max-w-7xl mx-auto w-full">
//         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
//           {/* Left sidebar - Document upload and options */}
//           <div className="lg:col-span-4">
//             <Card className="border border-primary/20 shadow-lg h-full">
//               <CardContent className="p-6">
//                 {!documentUploaded ? (
//                   <>
//                     <div className="mb-6" onDrop={handleDrop} onDragOver={handleDragOver}>
//                       <label htmlFor="file-upload" className="block text-sm font-medium mb-2">
//                         Upload your case documents (PDF, DOCX, or TXT)
//                       </label>
//                       <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-primary/30 rounded-md hover:border-primary/50 transition-colors">
//                         <div className="space-y-1 text-center">
//                           <Upload className="mx-auto h-12 w-12 text-primary/50" />
//                           <div className="flex text-sm justify-center">
//                             <label
//                               htmlFor="file-upload"
//                               className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary"
//                             >
//                               <span>Choose files</span>
//                               <input
//                                 id="file-upload"
//                                 ref={fileInputRef}
//                                 name="file-upload"
//                                 type="file"
//                                 multiple
//                                 className="sr-only"
//                                 onChange={handleFileChange}
//                                 disabled={uploading}
//                               />
//                             </label>
//                             <p className="pl-1">or drag and drop</p>
//                           </div>
//                           <p className="text-xs text-muted-foreground">PDF, DOCX, or TXT up to 10MB each</p>
//                         </div>
//                       </div>
//                     </div>

//                     {/* File list */}
//                     <AnimatePresence>
//                       {files.length > 0 && (
//                         <motion.div
//                           initial={{ opacity: 0, height: 0 }}
//                           animate={{ opacity: 1, height: "auto" }}
//                           exit={{ opacity: 0, height: 0 }}
//                           className="mb-6 overflow-hidden"
//                         >
//                           <h3 className="text-lg font-semibold mb-2">Selected Files ({files.length})</h3>
//                           <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
//                             {files.map((file, index) => (
//                               <motion.div
//                                 key={file.name}
//                                 initial={{ opacity: 0, x: -20 }}
//                                 animate={{ opacity: 1, x: 0 }}
//                                 exit={{ opacity: 0, x: 20 }}
//                                 transition={{ delay: index * 0.05 }}
//                                 className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-primary/10"
//                               >
//                                 <div className="flex items-center">
//                                   {getFileIcon(file.name)}
//                                   <div className="ml-3">
//                                     <p className="text-sm font-medium truncate max-w-xs">{file.name}</p>
//                                     <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
//                                   </div>
//                                 </div>

//                                 <div className="flex items-center">
//                                   {uploadStatus[file.name] === "success" && (
//                                     <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
//                                   )}
//                                   {uploadStatus[file.name] === "error" && (
//                                     <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
//                                   )}

//                                   {uploading && uploadStatus[file.name] === "pending" ? (
//                                     <div className="w-20 mr-2">
//                                       <Progress value={uploadProgress[file.name]} className="h-1" />
//                                     </div>
//                                   ) : (
//                                     <button
//                                       type="button"
//                                       onClick={() => removeFile(file.name)}
//                                       disabled={uploading}
//                                       className="text-muted-foreground hover:text-foreground transition-colors"
//                                     >
//                                       <X className="h-5 w-5" />
//                                     </button>
//                                   )}
//                                 </div>
//                               </motion.div>
//                             ))}
//                           </div>
//                         </motion.div>
//                       )}
//                     </AnimatePresence>

//                     <div>
//                       <Button
//                         type="button"
//                         onClick={handleUpload}
//                         disabled={files.length === 0 || uploading}
//                         className="w-full"
//                       >
//                         {uploading ? "Uploading..." : "Upload and Analyze"}
//                       </Button>
//                     </div>
//                   </>
//                 ) : (
//                   <div className="space-y-4">
//                     <div className="flex items-center justify-between">
//                       <div className="flex items-center">
//                         {getFileIcon(uploadedDocument?.name || "")}
//                         <div className="ml-3">
//                           <h3 className="text-lg font-semibold">{uploadedDocument?.name}</h3>
//                           <p className="text-sm text-muted-foreground">
//                             {uploadedDocument && (uploadedDocument.size / 1024).toFixed(1)} KB
//                           </p>
//                         </div>
//                       </div>
//                       <CheckCircle className="h-6 w-6 text-green-500" />
//                     </div>

//                     <div className="pt-4 border-t">
//                       <h3 className="text-lg font-semibold mb-3">Analysis Options</h3>

//                       <div className="space-y-4">
//                         <div className="space-y-2">
//                           <label className="text-sm font-medium">Analysis Mode:</label>
//                           <select
//                             className="w-full p-2 rounded bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary"
//                             value={analysisMode}
//                             onChange={(e) => setAnalysisMode(e.target.value as any)}
//                           >
//                             <option value="standard">Standard Analysis</option>
//                             <option value="hypothetical">Hypothetical Scenario Builder</option>
//                             <option value="hierarchical">Hierarchical Analysis</option>
//                           </select>
//                         </div>

//                         {analysisMode === "hypothetical" && (
//                           <div className="space-y-3 bg-muted/50 p-3 rounded-lg">
//                             <h4 className="font-medium text-sm">Modify Scenario Elements:</h4>
//                             <div>
//                               <label className="text-xs text-muted-foreground">Modified Facts:</label>
//                               <Textarea
//                                 placeholder="Describe modified facts..."
//                                 className="mt-1 w-full bg-background border-input text-sm"
//                                 value={hypotheticalScenario.facts}
//                                 onChange={(e) =>
//                                   setHypotheticalScenario({ ...hypotheticalScenario, facts: e.target.value })
//                                 }
//                               />
//                             </div>
//                             <div>
//                               <label className="text-xs text-muted-foreground">Modified Arguments:</label>
//                               <Textarea
//                                 placeholder="Describe modified arguments..."
//                                 className="mt-1 w-full bg-background border-input text-sm"
//                                 value={hypotheticalScenario.arguments}
//                                 onChange={(e) =>
//                                   setHypotheticalScenario({ ...hypotheticalScenario, arguments: e.target.value })
//                                 }
//                               />
//                             </div>
//                             <div>
//                               <label className="text-xs text-muted-foreground">Modified Precedents:</label>
//                               <Textarea
//                                 placeholder="Describe modified precedents..."
//                                 className="mt-1 w-full bg-background border-input text-sm"
//                                 value={hypotheticalScenario.precedents}
//                                 onChange={(e) =>
//                                   setHypotheticalScenario({ ...hypotheticalScenario, precedents: e.target.value })
//                                 }
//                               />
//                             </div>
//                           </div>
//                         )}

//                         {analysisMode === "hierarchical" && (
//                           <div className="space-y-2">
//                             <label className="text-sm font-medium">Analysis Level:</label>
//                             <div className="flex flex-wrap gap-2">
//                               <Button
//                                 variant={analysisLevel === 1 ? "default" : "outline"}
//                                 onClick={() => setAnalysisLevel(1)}
//                                 className="flex-1"
//                                 size="sm"
//                               >
//                                 Level 1<span className="text-xs block">Executive Summary</span>
//                               </Button>
//                               <Button
//                                 variant={analysisLevel === 2 ? "default" : "outline"}
//                                 onClick={() => setAnalysisLevel(2)}
//                                 className="flex-1"
//                                 size="sm"
//                               >
//                                 Level 2<span className="text-xs block">Detailed Breakdown</span>
//                               </Button>
//                               <Button
//                                 variant={analysisLevel === 3 ? "default" : "outline"}
//                                 onClick={() => setAnalysisLevel(3)}
//                                 className="flex-1"
//                                 size="sm"
//                               >
//                                 Level 3<span className="text-xs block">Comprehensive</span>
//                               </Button>
//                             </div>
//                           </div>
//                         )}

//                         <Button onClick={handleAnalyzeDocument} className="w-full" disabled={isAnalyzing}>
//                           {isAnalyzing ? (
//                             <>
//                               <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                               Analyzing...
//                             </>
//                           ) : (
//                             "Analyze Document"
//                           )}
//                         </Button>
//                       </div>
//                     </div>

//                     <div className="pt-4">
//                       <Button
//                         variant="outline"
//                         onClick={() => {
//                           setDocumentUploaded(false)
//                           setUploadedDocument(null)
//                           setFiles([])
//                           setUploadProgress({})
//                           setUploadStatus({})
//                           setAnalysisResult(null)
//                         }}
//                         className="w-full"
//                       >
//                         Upload Different Document
//                       </Button>
//                     </div>
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           </div>

//           {/* Main content area - Document Analysis and Chat */}
//           <div className="lg:col-span-8">
//             <Card className="border border-primary/20 shadow-lg h-full">
//               {/* Mode toggle tabs */}
//               <div className="border-b border-border">
//                 <div className="flex">
//                   <button
//                     onClick={() => setActiveTab("document")}
//                     className={`flex-1 py-3 px-4 text-center font-medium ${
//                       activeTab === "document" 
//                         ? "border-b-2 border-primary text-primary" 
//                         : "text-muted-foreground hover:text-foreground"
//                     }`}
//                   >
//                     Document Analysis
//                   </button>
//                   <button
//                     onClick={() => setActiveTab("chat")}
//                     className={`flex-1 py-3 px-4 text-center font-medium ${
//                       activeTab === "chat" 
//                         ? "border-b-2 border-primary text-primary" 
//                         : "text-muted-foreground hover:text-foreground"
//                     }`}
//                   >
//                     Chat
//                   </button>
//                 </div>
//               </div>

//               <CardContent className="p-0 h-[calc(100%-48px)]">
//                 {/* Document Analysis Content */}
//                 <div className={`h-full ${activeTab === "document" ? "block" : "hidden"}`}>
//                   {!documentUploaded || !analysisResult ? (
//                     <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-6">
//                       <FileText className="h-16 w-16 mb-4 opacity-30" />
//                       <h3 className="text-lg font-medium mb-2">
//                         {!documentUploaded ? "No Document Uploaded" : "No Analysis Yet"}
//                       </h3>
//                       <p>
//                         {!documentUploaded
//                           ? "Upload a document to see analysis results and chat with the AI about it."
//                           : "Select analysis options and click Analyze Document to see results."}
//                       </p>
//                     </div>
//                   ) : (
//                     <div className="h-full overflow-y-auto p-6">
//                       <div className="prose prose-sm max-w-none dark:prose-invert">
//                         <div 
//                           className="whitespace-pre-line"
//                           dangerouslySetInnerHTML={{ __html: analysisResult?.replace(/\n/g, "<br />") }} 
//                         />
//                       </div>
//                     </div>
//                   )}
//                 </div>

//                 {/* Chat Content */}
//                 <div className={`h-full flex flex-col ${activeTab === "chat" ? "block" : "hidden"}`}>
//                   <div className="flex-1 overflow-y-auto p-6 space-y-4">
//                     {messages.length === 0 ? (
//                       <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
//                         <MessageSquare className="h-16 w-16 mb-4 opacity-30" />
//                         <h3 className="text-lg font-medium mb-2">No Messages Yet</h3>
//                         <p>Ask questions about the document or request additional analysis.</p>
//                       </div>
//                     ) : (
//                       messages.map((message) => (
//                         <div 
//                           key={message.id} 
//                           className={`${message.role === "user" ? "text-right" : "text-left"}`}
//                         >
//                           <span
//                             className={`inline-block p-3 rounded-lg max-w-[80%] ${
//                               message.role === "user" 
//                                 ? "bg-primary text-primary-foreground" 
//                                 : "bg-muted"
//                             }`}
//                           >
//                             {message.content}
//                           </span>
//                         </div>
//                       ))
//                     )}
//                     <div ref={messagesEndRef} />
//                   </div>

//                   <form onSubmit={handleChatSubmit} className="p-4 border-t mt-auto">
//                     <div className="relative">
//                       <Textarea
//                         value={input}
//                         onChange={handleInputChange}
//                         placeholder="Ask about the document or request further analysis..."
//                         className="w-full p-2 pr-10 rounded bg-background border-input resize-none"
//                         rows={2}
//                         disabled={!documentUploaded}
//                       />
//                       <Button 
//                         type="submit" 
//                         size="icon" 
//                         className="absolute right-2 bottom-2 rounded-full"
//                         disabled={!documentUploaded || !input.trim()}
//                       >
//                         <Send className="h-4 w-4" />
//                       </Button>
//                     </div>
//                   </form>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         </div>
//       </main>
//     </div>
//   )
// }
// "use client"

// import type React from "react"

// import { useState, useRef, useEffect } from "react"
// import { motion, AnimatePresence } from "framer-motion"
// import { Upload, FileText, X, CheckCircle, AlertCircle, File, Send, Loader2, MessageSquare } from "lucide-react"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent } from "@/components/ui/card"
// import { Progress } from "@/components/ui/progress"
// import { useToast } from "@/components/ui/use-toast"
// import { Textarea } from "@/components/ui/textarea"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { useChat } from "ai/react"
// import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
// import { uploadDocument, analyzeDocument, chatWithDocument } from "@/lib/api"

// export default function UploadCase() {
//   const [files, setFiles] = useState<File[]>([])
//   const [uploading, setUploading] = useState(false)
//   const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
//   const [uploadStatus, setUploadStatus] = useState<Record<string, string>>({})
//   const [documentUploaded, setDocumentUploaded] = useState(false)
//   const [analysisMode, setAnalysisMode] = useState<"standard" | "hypothetical" | "hierarchical">("standard")
//   const [analysisLevel, setAnalysisLevel] = useState<1 | 2 | 3>(1)
//   const [hypotheticalScenario, setHypotheticalScenario] = useState({
//     facts: "",
//     arguments: "",
//     precedents: "",
//   })
//   const [isAnalyzing, setIsAnalyzing] = useState(false)
//   const [analysisResult, setAnalysisResult] = useState<string | null>(null)
//   const [uploadedDocument, setUploadedDocument] = useState<File | null>(null)
//   const [token, setToken] = useState<string>("");
//   const [docId, setDocId] = useState<string>("");
//   const [sessionId, setSessionId] = useState<string>("");

//   const fileInputRef = useRef<HTMLInputElement>(null)
//   const messagesEndRef = useRef<HTMLDivElement>(null)
//   const { toast } = useToast()

//   const { messages, input, handleInputChange, handleSubmit, append } = useChat({
//     onFinish: (message) => {
//       if (isAnalyzing) {
//         setAnalysisResult(message.content)
//         setIsAnalyzing(false)
//       }
//     },
//   })

//   // Scroll to bottom of chat when messages change
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
//   }, [messages])

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (!e.target.files) return

//     const selectedFiles = Array.from(e.target.files)
//     setFiles((prevFiles) => [...prevFiles, ...selectedFiles])

//     // Initialize progress and status for each file
//     const newProgress = { ...uploadProgress }
//     const newStatus = { ...uploadStatus }

//     selectedFiles.forEach((file) => {
//       newProgress[file.name] = 0
//       newStatus[file.name] = "pending"
//     })

//     setUploadProgress(newProgress)
//     setUploadStatus(newStatus)
//   }

//   const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault()

//     if (e.dataTransfer.files) {
//       const droppedFiles = Array.from(e.dataTransfer.files)
//       setFiles((prevFiles) => [...prevFiles, ...droppedFiles])

//       // Initialize progress and status for each file
//       const newProgress = { ...uploadProgress }
//       const newStatus = { ...uploadStatus }

//       droppedFiles.forEach((file) => {
//         newProgress[file.name] = 0
//         newStatus[file.name] = "pending"
//       })

//       setUploadProgress(newProgress)
//       setUploadStatus(newStatus)
//     }
//   }

//   const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault()
//   }

//   const removeFile = (fileName: string) => {
//     setFiles(files.filter((file) => file.name !== fileName))

//     // Remove from progress and status
//     const newProgress = { ...uploadProgress }
//     const newStatus = { ...uploadStatus }
//     delete newProgress[fileName]
//     delete newStatus[fileName]

//     setUploadProgress(newProgress)
//     setUploadStatus(newStatus)
//   }

//   const handleUpload = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (files.length === 0) return;
//     setUploading(true);
//     for (const file of files) {
//       setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));
//       setUploadStatus((prev) => ({ ...prev, [file.name]: "pending" }));
//       try {
//         const res = await uploadDocument(file, token);
//         setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));
//         setUploadStatus((prev) => ({ ...prev, [file.name]: "success" }));
//         toast({ title: "File uploaded successfully", description: `${file.name} has been uploaded.`, variant: "default" });
//         setDocumentUploaded(true);
//         setUploadedDocument(file);
//         setDocId(res.document?._id || res.document?.id || "");
//       } catch (err: any) {
//         setUploadStatus((prev) => ({ ...prev, [file.name]: "error" }));
//         toast({ title: "Upload failed", description: file.name + " could not be uploaded", variant: "destructive" });
//       }
//     }
//     setUploading(false);
//   };

//   const handleAnalyzeDocument = async () => {
//     if (!uploadedDocument || !docId) return;
//     setIsAnalyzing(true);
//     try {
//       const data: any = { analysis_mode: analysisMode, analysis_level: analysisLevel };
//       if (analysisMode === "hypothetical") {
//         data.content = JSON.stringify(hypotheticalScenario);
//       }
      
//       const res = await analyzeDocument(docId, data,token);//token
//       console.log(res.analysis.content);
//       const result = res.analysis || res.document?.analysis || JSON.stringify(res);
//       setAnalysisResult(result.content);
//       append({ role: "assistant", content: result.content});
//     } catch (error: any) {
//       setAnalysisResult("Error analyzing document: " + error.message);
//       append({ role: "assistant", content: "Error analyzing document: " + error.message });
//     }
//     setIsAnalyzing(false);
//   };

//   const handleChatSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!input.trim() || !docId) return;
//     append({ role: "user", content: input });
//     try {
//       console.log(analysisLevel,analysisMode)
//       const res = await chatWithDocument({ message: input, document_id: docId, session_id: sessionId ,mode:analysisMode}, token);
//       const aiMsg = res.response?.content || res.message || JSON.stringify(res);
//       append({ role: "assistant", content: aiMsg });
//     } catch (error: any) {
//       append({ role: "assistant", content: "Error: " + error.message });
//     }
//     handleInputChange({ target: { value: "" } } as any);
//   };

//   useEffect(() => {
//    setToken(localStorage.getItem("token") || "");
//   }, []);

//   const getFileIcon = (fileName: string) => {
//     const extension = fileName.split(".").pop()?.toLowerCase() || ""

//     switch (extension) {
//       case "pdf":
//         return <File className="text-red-500" />
//       case "doc":
//       case "docx":
//         return <File className="text-blue-500" />
//       case "txt":
//         return <FileText className="text-gray-400" />
//       default:
//         return <FileText className="text-gray-400" />
//     }
//   }

//   return (
//     <div className="min-h-screen py-12 px-4">
//       <motion.h1
//         className="text-3xl font-bold text-center mb-8"
//         initial={{ opacity: 0, y: -20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.5 }}
//       >
//         Case Document Analysis
//       </motion.h1>

//       <div className="max-w-6xl mx-auto">
//         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
//           {/* Document Upload Section - Always visible */}
//           <Card className="lg:col-span-5 border border-primary/20 shadow-lg">
//             <CardContent className="p-6">
//               {!documentUploaded ? (
//                 <>
//                   <div className="mb-6" onDrop={handleDrop} onDragOver={handleDragOver}>
//                     <label htmlFor="file-upload" className="block text-sm font-medium mb-2">
//                       Upload your case documents (PDF, DOCX, or TXT)
//                     </label>
//                     <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-primary/30 rounded-md hover:border-primary/50 transition-colors">
//                       <div className="space-y-1 text-center">
//                         <Upload className="mx-auto h-12 w-12 text-primary/50" />
//                         <div className="flex text-sm justify-center">
//                           <label
//                             htmlFor="file-upload"
//                             className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary"
//                           >
//                             <span>Choose files</span>
//                             <input
//                               id="file-upload"
//                               ref={fileInputRef}
//                               name="file-upload"
//                               type="file"
//                               multiple
//                               className="sr-only"
//                               onChange={handleFileChange}
//                               disabled={uploading}
//                             />
//                           </label>
//                           <p className="pl-1">or drag and drop</p>
//                         </div>
//                         <p className="text-xs text-muted-foreground">PDF, DOCX, or TXT up to 10MB each</p>
//                       </div>
//                     </div>
//                   </div>

//                   {/* File list */}
//                   <AnimatePresence>
//                     {files.length > 0 && (
//                       <motion.div
//                         initial={{ opacity: 0, height: 0 }}
//                         animate={{ opacity: 1, height: "auto" }}
//                         exit={{ opacity: 0, height: 0 }}
//                         className="mb-6 overflow-hidden"
//                       >
//                         <h3 className="text-lg font-semibold mb-2">Selected Files ({files.length})</h3>
//                         <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
//                           {files.map((file, index) => (
//                             <motion.div
//                               key={file.name}
//                               initial={{ opacity: 0, x: -20 }}
//                               animate={{ opacity: 1, x: 0 }}
//                               exit={{ opacity: 0, x: 20 }}
//                               transition={{ delay: index * 0.05 }}
//                               className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-primary/10"
//                             >
//                               <div className="flex items-center">
//                                 {getFileIcon(file.name)}
//                                 <div className="ml-3">
//                                   <p className="text-sm font-medium truncate max-w-xs">{file.name}</p>
//                                   <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
//                                 </div>
//                               </div>

//                               <div className="flex items-center">
//                                 {uploadStatus[file.name] === "success" && (
//                                   <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
//                                 )}
//                                 {uploadStatus[file.name] === "error" && (
//                                   <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
//                                 )}

//                                 {uploading && uploadStatus[file.name] === "pending" ? (
//                                   <div className="w-20 mr-2">
//                                     <Progress value={uploadProgress[file.name]} className="h-1" />
//                                   </div>
//                                 ) : (
//                                   <button
//                                     type="button"
//                                     onClick={() => removeFile(file.name)}
//                                     disabled={uploading}
//                                     className="text-muted-foreground hover:text-foreground transition-colors"
//                                   >
//                                     <X className="h-5 w-5" />
//                                   </button>
//                                 )}
//                               </div>
//                             </motion.div>
//                           ))}
//                         </div>
//                       </motion.div>
//                     )}
//                   </AnimatePresence>

//                   <div>
//                     <Button
//                       type="button"
//                       onClick={handleUpload}
//                       disabled={files.length === 0 || uploading}
//                       className="w-full"
//                     >
//                       {uploading ? "Uploading..." : "Upload and Analyze"}
//                     </Button>
//                   </div>
//                 </>
//               ) : (
//                 <div className="space-y-4">
//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center">
//                       {getFileIcon(uploadedDocument?.name || "")}
//                       <div className="ml-3">
//                         <h3 className="text-lg font-semibold">{uploadedDocument?.name}</h3>
//                         <p className="text-sm text-muted-foreground">
//                           {uploadedDocument && (uploadedDocument.size / 1024).toFixed(1)} KB
//                         </p>
//                       </div>
//                     </div>
//                     <CheckCircle className="h-6 w-6 text-green-500" />
//                   </div>

//                   <div className="pt-4 border-t">
//                     <h3 className="text-lg font-semibold mb-3">Analysis Options</h3>

//                     <div className="space-y-4">
//                       <div className="space-y-2">
//                         <label className="text-sm font-medium">Analysis Mode:</label>
//                         <select
//                           className="w-full p-2 rounded bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary"
//                           value={analysisMode}
//                           onChange={(e) => setAnalysisMode(e.target.value as any)}
//                         >
//                           <option value="standard">Standard Analysis</option>
//                           <option value="hypothetical">Hypothetical Scenario Builder</option>
//                           <option value="hierarchical">Hierarchical Analysis</option>
//                         </select>
//                       </div>

//                       {analysisMode === "hypothetical" && (
//                         <div className="space-y-3 bg-muted/50 p-3 rounded-lg">
//                           <h4 className="font-medium text-sm">Modify Scenario Elements:</h4>
//                           <div>
//                             <label className="text-xs text-muted-foreground">Modified Facts:</label>
//                             <Textarea
//                               placeholder="Describe modified facts..."
//                               className="mt-1 w-full bg-background border-input text-sm"
//                               value={hypotheticalScenario.facts}
//                               onChange={(e) =>
//                                 setHypotheticalScenario({ ...hypotheticalScenario, facts: e.target.value })
//                               }
//                             />
//                           </div>
//                           <div>
//                             <label className="text-xs text-muted-foreground">Modified Arguments:</label>
//                             <Textarea
//                               placeholder="Describe modified arguments..."
//                               className="mt-1 w-full bg-background border-input text-sm"
//                               value={hypotheticalScenario.arguments}
//                               onChange={(e) =>
//                                 setHypotheticalScenario({ ...hypotheticalScenario, arguments: e.target.value })
//                               }
//                             />
//                           </div>
//                           <div>
//                             <label className="text-xs text-muted-foreground">Modified Precedents:</label>
//                             <Textarea
//                               placeholder="Describe modified precedents..."
//                               className="mt-1 w-full bg-background border-input text-sm"
//                               value={hypotheticalScenario.precedents}
//                               onChange={(e) =>
//                                 setHypotheticalScenario({ ...hypotheticalScenario, precedents: e.target.value })
//                               }
//                             />
//                           </div>
//                         </div>
//                       )}

//                       {analysisMode === "hierarchical" && (
//                         <div className="space-y-2">
//                           <label className="text-sm font-medium">Analysis Level:</label>
//                           <div className="flex flex-wrap gap-2">
//                             <Button
//                               variant={analysisLevel === 1 ? "default" : "outline"}
//                               onClick={() => setAnalysisLevel(1)}
//                               className="flex-1"
//                               size="sm"
//                             >
//                               Level 1<span className="text-xs block">Executive Summary</span>
//                             </Button>
//                             <Button
//                               variant={analysisLevel === 2 ? "default" : "outline"}
//                               onClick={() => setAnalysisLevel(2)}
//                               className="flex-1"
//                               size="sm"
//                             >
//                               Level 2<span className="text-xs block">Detailed Breakdown</span>
//                             </Button>
//                             <Button
//                               variant={analysisLevel === 3 ? "default" : "outline"}
//                               onClick={() => setAnalysisLevel(3)}
//                               className="flex-1"
//                               size="sm"
//                             >
//                               Level 3<span className="text-xs block">Comprehensive</span>
//                             </Button>
//                           </div>
//                         </div>
//                       )}

//                       <Button onClick={handleAnalyzeDocument} className="w-full" disabled={isAnalyzing}>
//                         {isAnalyzing ? (
//                           <>
//                             <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                             Analyzing...
//                           </>
//                         ) : (
//                           "Analyze Document"
//                         )}
//                       </Button>
//                     </div>
//                   </div>

//                   <div className="pt-4">
//                     <Button
//                       variant="outline"
//                       onClick={() => {
//                         setDocumentUploaded(false)
//                         setUploadedDocument(null)
//                         setFiles([])
//                         setUploadProgress({})
//                         setUploadStatus({})
//                         setAnalysisResult(null)
//                       }}
//                       className="w-full"
//                     >
//                       Upload Different Document
//                     </Button>
//                   </div>
//                 </div>
//               )}
//             </CardContent>
//           </Card>

//           {/* Analysis Results and Chat Section - Visible after document upload */}
//           <Card
//             className={`lg:col-span-7 border border-primary/20 shadow-lg ${!documentUploaded ? "hidden lg:block" : ""}`}
//           >
//             <CardContent className="p-6">
//               {!documentUploaded ? (
//                 <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
//                   <FileText className="h-16 w-16 mb-4 opacity-30" />
//                   <h3 className="text-lg font-medium mb-2">No Document Uploaded</h3>
//                   <p>Upload a document to see analysis results and chat with the AI about it.</p>
//                 </div>
//               ) : (
//                 <div className="h-full flex flex-col">
//                   <Tabs defaultValue="analysis" className="flex-1 flex flex-col">
//                     <TabsList className="grid grid-cols-2 mb-4">
//                       <TabsTrigger value="analysis">Document Analysis</TabsTrigger>
//                       <TabsTrigger value="chat">Chat</TabsTrigger>
//                     </TabsList>

//                     <TabsContent value="analysis" className="flex-1 overflow-hidden flex flex-col">
//                       {!analysisResult ? (
//                         <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
//                           <FileText className="h-16 w-16 mb-4 opacity-30" />
//                           <h3 className="text-lg font-medium mb-2">No Analysis Yet</h3>
//                           <p>Select analysis options and click "Analyze Document" to see results.</p>
//                         </div>
//                       ) : (
//                         <div className="flex-1 overflow-y-auto">
//                           <div className="prose prose-sm max-w-none dark:prose-invert">
//                               <div
//                                 className="whitespace-pre-line"
//                                 dangerouslySetInnerHTML={{ __html: analysisResult?.replace(/\n/g, "<br />") }}
//                               />
                            
//                           </div>
//                         </div>
//                       )}
//                     </TabsContent>

//                     <TabsContent value="chat" className="flex-1 overflow-hidden flex flex-col">
//                       <div className="flex-1 overflow-y-auto p-4 space-y-4">
//                         {messages.length === 0 ? (
//                           <div className="text-center text-muted-foreground mt-8">
//                             <MessageSquare className="mx-auto h-12 w-12 mb-2 opacity-30" />
//                             <p>Ask questions about the document or request additional analysis.</p>
//                           </div>
//                         ) : (
//                           messages.map((message) => (
//                             <div key={message.id} className={`${message.role === "user" ? "text-right" : "text-left"}`}>
//                               <span
//                                 className={`inline-block p-3 rounded-lg max-w-[80%] ${
//                                   message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
//                                 }`}
//                               >
//                                 {message.content}
//                               </span>
//                             </div>
//                           ))
//                         )}
//                         <div ref={messagesEndRef} />
//                       </div>

//                       <form onSubmit={handleChatSubmit} className="p-4 border-t">
//                         <div className="relative">
//                           <Textarea
//                             value={input}
//                             onChange={handleInputChange}
//                             placeholder="Ask about the document or request further analysis..."
//                             className="w-full p-2 pr-10 rounded bg-background border-input resize-none"
//                             rows={2}
//                           />
//                           <Button type="submit" size="icon" className="absolute right-2 bottom-2 rounded-full">
//                             <Send className="h-4 w-4" />
//                           </Button>
//                         </div>
//                       </form>
//                     </TabsContent>
//                   </Tabs>
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     </div>
//   )
// }
