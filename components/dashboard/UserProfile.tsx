"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"

export function UserProfile({ theme }) {
  const [detailedResponses, setDetailedResponses] = useState(false)

  return (
    <Card
      className={`bg-black/30 backdrop-blur-md shadow-lg border border-cyan-500/30 ${
        theme === "cyberBlue" ? "text-cyan-300" : theme === "stealthMode" ? "text-orange-300" : "text-emerald-300"
      }`}
    >
      <CardHeader>
        <CardTitle className="text-xl font-bold">User Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4 mb-4">
          <Avatar className="w-16 h-16 border-2 border-cyan-500">
            <AvatarImage src="/placeholder-avatar.jpg" alt="User avatar" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">John Doe</h3>
            <p className="text-sm text-cyan-400">Legal Expert</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="detailed-responses" className="text-sm">
              Detailed AI Responses
            </Label>
            <Switch
              id="detailed-responses"
              checked={detailedResponses}
              onCheckedChange={setDetailedResponses}
              className="bg-cyan-900 data-[state=checked]:bg-cyan-500"
            />
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button variant="outline" className="w-full border-cyan-500 hover:bg-cyan-900/30">
              Edit Profile
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button variant="outline" className="w-full border-cyan-500 hover:bg-cyan-900/30">
              Customize Dashboard
            </Button>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  )
}

