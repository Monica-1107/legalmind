"use client"

import { useState, useEffect, createContext, useContext } from "react"
import { X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = (toast) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prevToasts) => [...prevToasts, { id, ...toast }])
  }

  const removeToast = (id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toast: addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function Toast({ toast, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 5000)

    return () => clearTimeout(timer)
  }, [onClose])

  const variants = {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 20, scale: 0.95 },
  }

  const getVariant = () => {
    if (toast.variant === "destructive") return "bg-red-500"
    if (toast.variant === "success") return "bg-green-500"
    return "bg-navy-800 border border-gold-500/20"
  }

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`p-4 rounded-lg shadow-lg max-w-sm ${getVariant()}`}
    >
      <div className="flex justify-between items-start">
        <div>
          {toast.title && <h4 className="font-semibold">{toast.title}</h4>}
          {toast.description && <p className="text-sm">{toast.description}</p>}
        </div>
        <button onClick={onClose} className="ml-4 text-gray-400 hover:text-white">
          <X size={16} />
        </button>
      </div>
    </motion.div>
  )
}

