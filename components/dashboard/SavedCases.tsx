"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion } from "framer-motion"

const savedCases = [
  { id: 1, title: "Smith v. Johnson", date: "2023-05-15" },
  { id: 2, title: "State v. Williams", date: "2023-05-10" },
  { id: 3, title: "Doe v. Corporation XYZ", date: "2023-05-05" },
  { id: 4, title: "Green v. City Council", date: "2023-04-30" },
  { id: 5, title: "Brown v. Education Board", date: "2023-04-25" },
]

export function SavedCases({ theme }) {
  return (
    <Card
      className={`bg-black/30 backdrop-blur-md shadow-lg border border-cyan-500/30 ${
        theme === "cyberBlue" ? "text-cyan-300" : theme === "stealthMode" ? "text-orange-300" : "text-emerald-300"
      }`}
    >
      <CardHeader>
        <CardTitle className="text-xl font-bold">Saved Cases</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] w-full pr-4">
          {savedCases.map((caseItem) => (
            <motion.div
              key={caseItem.id}
              className="mb-4 p-3 bg-cyan-900/20 rounded-lg border border-cyan-500/30 cursor-pointer hover:bg-cyan-900/30 transition-colors duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <h3 className="font-semibold">{caseItem.title}</h3>
              <p className="text-sm text-cyan-400">{caseItem.date}</p>
            </motion.div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

