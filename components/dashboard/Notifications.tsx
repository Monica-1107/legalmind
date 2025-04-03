"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const notifications = [
  { id: 1, message: "Case analysis complete: Smith v. Johnson" },
  { id: 2, message: "New legal update: Amendment to Section 123 of XYZ Act" },
  { id: 3, message: "AI Insight: Potential precedent found for your current case" },
]

export function Notifications({ theme }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed bottom-4 right-4">
      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
        <Button
          variant="outline"
          size="icon"
          className={`rounded-full bg-black/50 border-2 ${
            theme === "cyberBlue"
              ? "border-cyan-500 text-cyan-300"
              : theme === "stealthMode"
                ? "border-orange-500 text-orange-300"
                : "border-emerald-500 text-emerald-300"
          } shadow-lg hover:bg-cyan-900/30`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <Bell className="h-5 w-5" />
        </Button>
      </motion.div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-14 right-0 w-64"
          >
            <Card
              className={`bg-black/80 backdrop-blur-md shadow-lg border ${
                theme === "cyberBlue"
                  ? "border-cyan-500/50 text-cyan-300"
                  : theme === "stealthMode"
                    ? "border-orange-500/50 text-orange-300"
                    : "border-emerald-500/50 text-emerald-300"
              } p-4`}
            >
              <h3 className="font-semibold mb-2">Notifications</h3>
              <ul className="space-y-2">
                {notifications.map((notification) => (
                  <li key={notification.id} className="text-sm">
                    {notification.message}
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

