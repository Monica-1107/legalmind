"use client"

import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, FileText, X, CheckCircle, AlertCircle, File, Send, Loader2, MessageSquare, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { uploadDocument, analyzeDocument, sendSessionMessage, getSessions as apiGetSessions, createSession as apiCreateSession, deleteSession as apiDeleteSession, getSessionMessages as apiGetSessionMessages } from "@/lib/api"
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
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [sessionsError, setSessionsError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast }: any = useToast()

  // FIRST_EDIT: move session management state above useChat so activeSessionId is declared before useChat
  const [sessions, setSessions] = useState<Array<{ id: string; name: string; createdAt: string; docId: string }>>([])
  const [activeSessionId, setActiveSessionId] = useState<string>("")
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Chat messages state to isolate sessions manually
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string }>>([])
  const [chatInput, setChatInput] = useState<string>("")

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  // Load auth token from localStorage on mount
  useEffect(() => {
    const t = localStorage.getItem("token") || ""
    setToken(t)
  }, [])

  // Load sessions on mount
  useEffect(() => {
    const loadSessions = async () => {
      setLoadingSessions(true)
      try {
        const data: any[] = await apiGetSessions(token)
        // Expect data as array of sessions
        setSessions(data.map((s: any) => ({ id: s._id, name: s.title, createdAt: s.created_at, docId: s.document_id || "" })))
        if (data.length > 0) {
          const firstId = data[0]._id
          setActiveSessionId(firstId)
          setSessionId(firstId)
          // Load messages for first session
          const msgs = await apiGetSessionMessages(firstId, token)
          setChatMessages(msgs.map((m: any) => ({ role: m.role, content: m.content })))
        }
      } catch (e: any) {
        setSessionsError(e.message || "Failed to load sessions")
      } finally { setLoadingSessions(false) }
    }
    if (token) loadSessions()
  }, [token])

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
      setChatMessages(prev => [...prev, { role: 'assistant', content: result.content }])
    } catch (error: any) {
      setAnalysisResult("Error analyzing document: " + error.message)
      setChatMessages(prev => [...prev, { role: 'assistant', content: "Error analyzing document: " + error.message }])
    }
    setIsAnalyzing(false)
  }

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || !sessionId) return
    // Show user message immediately
    setChatMessages(prev => [...prev, { role: 'user', content: chatInput }])
    try {
      const payload = { content: chatInput, document_id: docId, generate_response: true }
      const res = await sendSessionMessage(sessionId, payload, token)
      // Append assistant response
      if (res.ai_message) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: res.ai_message.content }])
      } else if (res.user_message) {
        // Fallback if only user_message object is returned
        setChatMessages(prev => [...prev, { role: 'assistant', content: res.user_message.content }])
      }
    } catch (error: any) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Error: ' + error.message }])
    }
    setChatInput("")
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

  // Helper to create a new session
  const createNewSession = async () => {
    try {
      const created = await apiCreateSession("", token)
      const id = created._id
      setSessions([{ id, name: created.title, createdAt: created.created_at, docId: "" }, ...sessions])
      setActiveSessionId(id)
      setSessionId(id)
      // reset state
      setFiles([])
      setUploadedDocument(null)
      setDocId("")
      setAnalysisResult(null)
      setAnalysisMode("standard")
      setAnalysisLevel(1)
      setHypotheticalScenario({ facts: "", arguments: "", precedents: "" })
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to create session", variant: "destructive" })
    }
  }

  // Helper to delete a session
  const deleteSession = async (id: string) => {
    try {
      await apiDeleteSession(id, token)
      const filtered = sessions.filter(s => s.id !== id)
      setSessions(filtered)
      if (activeSessionId === id) {
        const newActive = filtered.length > 0 ? filtered[0].id : ""
        setActiveSessionId(newActive)
        setSessionId(newActive)
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to delete session", variant: "destructive" })
    }
  }

  // Helper to switch session
  const switchSession = async (id: string) => {
    setActiveSessionId(id)
    setSessionId(id)
    try {
      const msgs = await apiGetSessionMessages(id, token)
      setChatMessages(msgs.map((m: any) => ({ role: m.role, content: m.content })))
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to load messages", variant: "destructive" })
    }
  }

  // Helper: get active session object
  const activeSession = sessions.find((s) => s.id === activeSessionId)

  // Analysis buttons UI
  const renderAnalysisButtons = () => (
    <div className="flex flex-wrap gap-2 mb-4">
              <Button
        variant={analysisMode === "standard" ? "default" : "outline"}
        className="bg-gold-500/90 text-navy-900 font-semibold"
        onClick={() => setAnalysisMode("standard")}
      >
        Standard Analysis
              </Button>
                      <Button
        variant={analysisMode === "hierarchical" && analysisLevel === 1 ? "default" : "outline"}
        onClick={() => { setAnalysisMode("hierarchical"); setAnalysisLevel(1); }}
      >
        Hierarchical L1
                      </Button>
                      <Button
        variant={analysisMode === "hierarchical" && analysisLevel === 2 ? "default" : "outline"}
        onClick={() => { setAnalysisMode("hierarchical"); setAnalysisLevel(2); }}
      >
        Hierarchical L2
                      </Button>
                      <Button
        variant={analysisMode === "hierarchical" && analysisLevel === 3 ? "default" : "outline"}
        onClick={() => { setAnalysisMode("hierarchical"); setAnalysisLevel(3); }}
      >
        Hierarchical L3
                      </Button>
              <Button
        variant={analysisMode === "hypothetical" ? "default" : "outline"}
        onClick={() => setAnalysisMode("hypothetical")}
      >
        Hypothetical Case Scenario
              </Button>
            </div>
  );

  // File attachment from chat input
  const handleAttachFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    try {
      setUploading(true);
      const res = await uploadDocument(file, token);
      setDocId(res.document?._id || res.document?.id || "");
      setUploadedDocument(file);
      setChatMessages(prev => [...prev, { role: "assistant", content: `File uploaded: ${file.name}` }])
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  // Main chat/analysis area
  const renderMainArea = () => {
    // If no session selected
    if (!activeSessionId) {
      return <div className="flex-1 flex items-center justify-center text-muted-foreground">Select or create a session to begin.</div>;
    }
    // Always show chat/analysis UI; file upload is part of chat
    return (
      <div className="flex flex-col h-full w-full max-w-3xl mx-auto bg-navy-900/60 rounded-lg shadow-lg p-6">
        {/* Document info and attach button */}
        <div className="mb-2 flex items-center gap-2">
          <FileText className="text-gold-500" />
          <span className="font-semibold text-gold-500 truncate max-w-xs">{uploadedDocument?.name || "No document uploaded"}</span>
          <label htmlFor="chat-file-upload" className="ml-auto cursor-pointer p-1 hover:bg-navy-800/50 rounded">
            <Upload className="h-5 w-5 text-gold-500" />
            <input id="chat-file-upload" type="file" className="sr-only" onChange={handleAttachFile} disabled={uploading} />
          </label>
        </div>
        {renderAnalysisButtons()}
        {/* Analysis options for hypothetical mode */}
        {analysisMode === "hypothetical" && (
          <div className="mb-4 bg-navy-800/60 p-4 rounded-lg">
            <div className="mb-2 font-medium text-gold-500">Modify Scenario Elements:</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Textarea
                placeholder="Modified Facts..."
                className="bg-navy-900 border-gold-500 text-gold-500"
                value={hypotheticalScenario.facts}
                onChange={e => setHypotheticalScenario({ ...hypotheticalScenario, facts: e.target.value })}
              />
              <Textarea
                placeholder="Modified Arguments..."
                className="bg-navy-900 border-gold-500 text-gold-500"
                value={hypotheticalScenario.arguments}
                onChange={e => setHypotheticalScenario({ ...hypotheticalScenario, arguments: e.target.value })}
              />
              <Textarea
                placeholder="Modified Precedents..."
                className="bg-navy-900 border-gold-500 text-gold-500"
                value={hypotheticalScenario.precedents}
                onChange={e => setHypotheticalScenario({ ...hypotheticalScenario, precedents: e.target.value })}
                  />
                </div>
            </div>
          )}
        {/* Chat/analysis messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {analysisResult && (
            <div className="text-left">
              <div className="inline-block bg-gold-500/10 border border-gold-500 text-gold-500 rounded-lg p-3 max-w-[80%]">
                <div className="font-semibold mb-1">AI Analysis</div>
                <div dangerouslySetInnerHTML={{ __html: analysisResult?.replace(/\n/g, "<br />") }} />
                  </div>
            </div>
          )}
          {chatMessages.map((message, idx) => {
            // Ensure content is a string (extract 'text' if it's an object)
            let contentText: string;
            if (message.content && typeof message.content === 'object' && 'text' in message.content) {
              // @ts-ignore
              contentText = message.content.text as string;
            } else {
              contentText = String(message.content);
            }
            return (
              <div key={idx} className={message.role === "user" ? "text-right" : "text-left"}>
                <span
                  className={`inline-block p-3 rounded-lg max-w-[80%] ${
                    message.role === "user"
                      ? "bg-gold-500 text-navy-900"
                      : "bg-navy-800 text-gold-500 border border-gold-500"
                  }`}
                >
                  {contentText}
                </span>
              </div>
            );
          })}
                <div ref={messagesEndRef} />
              </div>
        {/* Chat input */}
        <form onSubmit={handleChatSubmit} className="mt-auto">
          <div className="flex gap-2 items-end">
                  <Textarea
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="Ask about the document or request further analysis..."
              className="flex-1 bg-navy-900 border-gold-500 text-gold-500 resize-none"
                    rows={2}
                  />
            <Button type="submit" size="icon" className="bg-gold-500 text-navy-900 hover:bg-gold-600 rounded-full">
              <Send className="h-5 w-5" />
                  </Button>
                </div>
              </form>
      </div>
    );
  };

  // Sidebar UI
  const renderSidebar = () => (
    <aside className={`bg-navy-900 text-gold-500 w-72 flex-shrink-0 flex flex-col h-full border-r border-navy-800 transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-72"} z-20`}> 
      <div className="flex items-center justify-between px-4 py-4 border-b border-navy-800">
        <span className="font-bold text-lg">Sessions</span>
        <Button size="sm" variant="outline" className="border-gold-500 text-gold-500 hover:bg-gold-500/10" onClick={createNewSession}>
          + New
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="text-center text-gold-500/60 py-8">No sessions yet</div>
        ) : (
          <ul className="divide-y divide-navy-800">
            {sessions.map((session) => (
              <li key={session.id} className={`flex items-center px-4 py-3 cursor-pointer group ${activeSessionId === session.id ? "bg-navy-800/60" : "hover:bg-navy-800/30"}`}
                  onClick={() => switchSession(session.id)}>
                <div className="flex-1">
                  <div className="font-medium truncate">{session.name}</div>
                  <div className="text-xs text-gold-500/60">{new Date(session.createdAt).toLocaleString()}</div>
                </div>
                <button
                  className="ml-2 text-gold-500 hover:text-red-500"
                  onClick={e => { e.stopPropagation(); deleteSession(session.id); }}
                  title="Delete session"
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
          )}
        </div>
      <div className="p-2 border-t border-navy-800 flex justify-center md:hidden">
        <Button size="sm" variant="ghost" onClick={() => setSidebarOpen(false)}>
          Hide
        </Button>
    </div>
    </aside>
  );

  // Sidebar toggle button for mobile
  const renderSidebarToggle = () => (
    <Button className="fixed top-20 left-2 z-30 md:hidden bg-navy-900 text-gold-500 border-gold-500 border" size="icon" onClick={() => setSidebarOpen(true)}>
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
    </Button>
  );

  return (
    <div className="flex min-h-screen bg-background pt-16">
      {/* Sidebar (collapsible on mobile) */}
      <div className="hidden md:block h-full">{renderSidebar()}</div>
      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-10 md:hidden" onClick={() => setSidebarOpen(false)} />}
      <div className={`fixed top-16 left-0 h-[calc(100%-4rem)] z-30 md:hidden transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-72"}`}>{renderSidebar()}</div>
      {!sidebarOpen && renderSidebarToggle()}
      {/* Main chat/analysis area */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-background">
        {renderMainArea()}
      </div>
    </div>
  )
}
