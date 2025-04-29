"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Upload, MessageSquare, FileText, BarChart4, Users, Clock, ChevronRight, Scale } from "lucide-react"
import { useAuth } from "@/frontend/context/AuthContext"
import { HypotheticalScenarioBuilder } from "@/components/dashboard/HypotheticalScenarioBuilder"
import { HierarchicalAnalysis } from "@/components/dashboard/HierarchicalAnalysis"
import { useRouter } from "next/navigation"

type ActivityItem = {
  id: string;
  type: string;
  description: string;
  time: string;
  timeAgo?: string;
};

type DocumentItem = {
  id: string;
  title?: string;
  filename?: string;
};

type Analytics = {
  documents_analyzed: number;
  chat_sessions: number;
  hypothetical_scenarios: number;
};

export default function Dashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [analytics, setAnalytics] = useState<Analytics>({documents_analyzed: 0, chat_sessions: 0, hypothetical_scenarios: 0})
  console.log(user)
  const [token, setToken] = useState("")
  useEffect(() => {
    const token = localStorage.getItem("token");
    setToken(token || "")
  }, [user]);

  useEffect(() => {
    if (user && token) {
      fetch("http://localhost:5000/api/user/activity", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data: ActivityItem[]) => {
          // Format timeAgo for each item
          setActivity(
            data.map((item) => ({
              ...item,
              timeAgo: getTimeAgo(item.time),
            }))
          );
        });
      fetch("http://localhost:5000/api/user/documents", {
        headers: { "Authorization": `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((docs: DocumentItem[]) => setDocuments(docs));
      fetch("http://localhost:5000/api/user/analytics", {
        headers: { "Authorization": `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((a: Analytics) => setAnalytics(a));
    }
  }, [user]);

  function getTimeAgo(isoTime: string) {
    if (!isoTime) return "";
    const now = new Date();
    const date = new Date(isoTime);
    const diff = Math.floor((now - date) / 1000); // seconds
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 pt-20 pb-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome, {user?.name || "User"}</h1>
            <p className="text-gray-400">Your legal dashboard and analysis center</p>
          </div>
          <div className="flex mt-4 md:mt-0">
            <Button className="bg-gold-500 hover:bg-gold-600 text-navy-900" onClick={() => router.push("/upload")}>
              <MessageSquare className="mr-2 h-4 w-4" />
              New chat
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-navy-700/50 p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="hypothetical">Hypothetical Scenarios</TabsTrigger>
            <TabsTrigger value="hierarchical">Hierarchical Analysis</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-navy-800/50 border-gold-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium text-gold-500">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {activity.map((item: ActivityItem) => (
                      <li key={item.id} className="flex items-center text-sm">
                        {item.type === 'document' && <FileText className="h-4 w-4 mr-2 text-gray-400" />}
                        {item.type === 'chat' && <MessageSquare className="h-4 w-4 mr-2 text-gray-400" />}
                        {item.type === 'analysis' && <BarChart4 className="h-4 w-4 mr-2 text-gray-400" />}
                        <span>{item.description}</span>
                        <span className="ml-auto text-xs text-gray-500">{item.timeAgo}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              
              <Card className="bg-navy-800/50 border-gold-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium text-gold-500">Saved Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {documents.map((doc: DocumentItem) => (
                      <li key={doc.id} className="flex items-center text-sm">
                        <FileText className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{doc.title || doc.filename}</span>
                        <Button variant="ghost" size="sm" className="ml-auto h-8 w-8 p-0">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              
              <Card className="bg-navy-800/50 border-gold-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium text-gold-500">Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Documents Analyzed</span>
                        <span className="font-medium">{analytics.documents_analyzed}</span>
                      </div>
                      <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gold-500" style={{ width: `${(analytics.documents_analyzed / 100) * 100}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>AI Chat Sessions</span>
                        <span className="font-medium">{analytics.chat_sessions}</span>
                      </div>
                      <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gold-500" style={{ width: `${(analytics.chat_sessions / 100) * 100}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Hypothetical Scenarios</span>
                        <span className="font-medium">{analytics.hypothetical_scenarios}</span>
                      </div>
                      <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gold-500" style={{ width: `${(analytics.hypothetical_scenarios / 100) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card className="bg-navy-800/50 border-gold-500/20">
              <CardHeader>
                <CardTitle className="text-xl font-medium text-gold-500">Featured Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <motion.div 
                    whileHover={{ scale: 1.03 }}
                    className="bg-navy-700/50 p-4 rounded-lg border border-navy-600 cursor-pointer"
                    onClick={() => setActiveTab("hypothetical")}
                  >
                    <div className="flex items-center mb-2">
                      <div className="bg-gold-500/20 p-2 rounded-full mr-3">
                        <Scale className="h-5 w-5 text-gold-500" />
                      </div>
                      <h3 className="font-medium">Hypothetical Scenario Builder</h3>
                    </div>
                    <p className="text-sm text-gray-400">
                      Modify case elements and see how they affect legal outcomes
                    </p>
                  </motion.div>
                  
                  <motion.div 
                    whileHover={{ scale: 1.03 }}
                    className="bg-navy-700/50 p-4 rounded-lg border border-navy-600 cursor-pointer"
                    onClick={() => setActiveTab("hierarchical")}
                  >
                    <div className="flex items-center mb-2">
                      <div className="bg-gold-500/20 p-2 rounded-full mr-3">
                        <BarChart4 className="h-5 w-5 text-gold-500" />
                      </div>
                      <h3 className="font-medium">Hierarchical Analysis</h3>
                    </div>
                    <p className="text-sm text-gray-400">
                      View legal analysis at different levels of complexity
                    </p>
                  </motion.div>
                  
                  <motion.div 
                    whileHover={{ scale: 1.03 }}
                    className="bg-navy-700/50 p-4 rounded-lg border border-navy-600 cursor-pointer"
                  >
                    <div className="flex items-center mb-2">
                      <div className="bg-gold-500/20 p-2 rounded-full mr-3">
                        <Users className="h-5 w-5 text-gold-500" />
                      </div>
                      <h3 className="font-medium">Collaborative Review</h3>
                    </div>
                    <p className="text-sm text-gray-400">
                      Share and collaborate on legal documents with team members
                    </p>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="hypothetical">
            <HypotheticalScenarioBuilder />
          </TabsContent>
          
          <TabsContent value="hierarchical">
            <HierarchicalAnalysis />
          </TabsContent>
          
          <TabsContent value="settings">
            <Card className="bg-navy-800/50 border-gold-500/20">
              <CardHeader>
                <CardTitle className="text-xl font-medium text-gold-500">Account Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <input 
                      type="email" 
                      value={user?.email || ""} 
                      className="w-full p-2 rounded bg-navy-700 border border-navy-600 focus:outline-none focus:ring-2 focus:ring-gold-500"
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Name</label>
                    <input 
                      type="text" 
                      value={`${user?.first_name || ""} ${user?.last_name || ""}`}
                      readOnly
                      className="w-full p-2 rounded bg-navy-700 border border-navy-600 focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                  
                </div>
                <Button className="bg-gold-500 hover:bg-gold-600 text-navy-900">Update Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
