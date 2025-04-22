"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, X, Send } from "lucide-react"
import { useChat } from "ai/react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, input, handleInputChange, handleSubmit } = useChat()

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSubmit(e)
  }

  return (
    <>
      <motion.div
        className="fixed bottom-4 right-4 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-gold-500 text-navy-900 rounded-full p-4 shadow-lg hover:bg-gold-600 transition-colors"
          aria-label="Open legal assistant chat"
        >
          <MessageSquare size={24} />
        </button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-20 right-4 w-96 bg-navy-800 rounded-lg shadow-xl z-50 flex flex-col"
            initial={{ opacity: 0, y: 50, height: 500 }}
            animate={{ opacity: 1, y: 0, height: 500 }}
            exit={{ opacity: 0, y: 50 }}
          >
            <div className="flex justify-between items-center p-4 border-b border-navy-700 bg-navy-900 rounded-t-lg">
              <h3 className="text-lg font-semibold text-gold-500">Legal Assistant</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-400 mt-8">
                    <MessageSquare className="mx-auto h-12 w-12 mb-2 opacity-50" />
                    <p>How can I assist with your legal questions today?</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className={`${message.role === "user" ? "text-right" : "text-left"}`}>
                      <span
                        className={`inline-block p-3 rounded-lg max-w-[80%] ${
                          message.role === "user" ? "bg-gold-500 text-navy-900" : "bg-navy-700"
                        }`}
                      >
                        {message.content}
                      </span>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleChatSubmit} className="p-4 border-t border-navy-700">
                <div className="relative">
                  <Textarea
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Ask a legal question..."
                    className="w-full p-2 pr-10 rounded bg-navy-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none"
                    rows={2}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="absolute right-2 bottom-2 bg-gold-500 hover:bg-gold-600 text-navy-900 rounded-full p-1"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

