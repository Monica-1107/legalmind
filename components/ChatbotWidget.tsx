"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, X } from "lucide-react"
import { useChat } from "ai/react"

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const { messages, input, handleInputChange, handleSubmit } = useChat()

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
        >
          <MessageSquare size={24} />
        </button>
      </motion.div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-20 right-4 w-80 bg-navy-800 rounded-lg shadow-xl z-50"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
          >
            <div className="flex justify-between items-center p-4 border-b border-navy-700">
              <h3 className="text-lg font-semibold">Legal Assistant</h3>
              <button onClick={() => setIsOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="h-80 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`${message.role === "user" ? "text-right" : "text-left"}`}>
                  <span
                    className={`inline-block p-2 rounded-lg ${message.role === "user" ? "bg-gold-500 text-navy-900" : "bg-navy-700"}`}
                  >
                    {message.content}
                  </span>
                </div>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="p-4 border-t border-navy-700">
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Ask a legal question..."
                className="w-full p-2 rounded bg-navy-700 text-white placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

