"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, FileText, X, CheckCircle, AlertCircle, File } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"

export default function UploadCase() {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})
  const [uploadStatus, setUploadStatus] = useState({})
  const fileInputRef = useRef(null)
  const { toast } = useToast()

  const handleFileChange = (e) => {
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

  const handleDrop = (e) => {
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

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const removeFile = (fileName) => {
    setFiles(files.filter((file) => file.name !== fileName))

    // Remove from progress and status
    const newProgress = { ...uploadProgress }
    const newStatus = { ...uploadStatus }
    delete newProgress[fileName]
    delete newStatus[fileName]

    setUploadProgress(newProgress)
    setUploadStatus(newStatus)
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (files.length === 0) return

    setUploading(true)

    // Process each file with simulated progress
    for (const file of files) {
      // Simulate upload progress for each file
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress((prev) => ({
          ...prev,
          [file.name]: i,
        }))
        await new Promise((resolve) => setTimeout(resolve, 200))
      }

      // Randomly simulate success or failure (90% success rate)
      const isSuccess = Math.random() < 0.9

      setUploadStatus((prev) => ({
        ...prev,
        [file.name]: isSuccess ? "success" : "error",
      }))

      // Show toast notification
      toast({
        title: isSuccess ? "File uploaded successfully" : "Upload failed",
        description: `${file.name} ${isSuccess ? "has been uploaded and analyzed" : "could not be uploaded"}`,
        variant: isSuccess ? "default" : "destructive",
      })
    }

    setUploading(false)
  }

  const getFileIcon = (fileName) => {
    const extension = fileName.split(".").pop().toLowerCase()

    switch (extension) {
      case "pdf":
        return <File className="text-red-500" />
      case "doc":
      case "docx":
        return <File className="text-blue-500" />
      case "txt":
        return <FileText className="text-gray-500" />
      default:
        return <FileText className="text-gray-400" />
    }
  }

  return (
    <div className="min-h-screen py-20 px-4">
      <motion.h1
        className="text-4xl font-playfair text-center mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Upload Case Documents
      </motion.h1>

      <div className="max-w-2xl mx-auto">
        <Card className="border border-primary/20 shadow-lg">
          <CardContent className="p-6">
            <div className="mb-6" onDrop={handleDrop} onDragOver={handleDragOver}>
              <label htmlFor="file-upload" className="block text-sm font-medium mb-2">
                Upload your case documents (PDF, DOCX, or TXT)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-primary/30 rounded-md hover:border-primary/50 transition-colors">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-primary/50" />
                  <div className="flex text-sm">
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
                          {uploadStatus[file.name] === "error" && <AlertCircle className="h-5 w-5 text-red-500 mr-2" />}

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
}

