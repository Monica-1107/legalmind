"use client"

import { useEffect, useState, useRef } from "react"
import { uploadDocument, create_graph } from "@/lib/api"
import dynamic from "next/dynamic"
import { motion, AnimatePresence } from "framer-motion"
import { ZoomIn, ZoomOut, RefreshCw, Upload, X, Filter, Download, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { enhanceGraphWithLLM } from "./openrouter"

// Dynamically import ForceGraph to avoid SSR issues
const ForceGraph3D = dynamic(() => import("react-force-graph-3d"), { ssr: false })

export default function KnowledgeGraph() {
  const [graphData, setGraphData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedNode, setSelectedNode] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [graphInfo, setGraphInfo] = useState(null)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [showInfoPanel, setShowInfoPanel] = useState(false)
  const [filterType, setFilterType] = useState("all")
  const [filteredData, setFilteredData] = useState(null)
  const [graphDomain, setGraphDomain] = useState("legal")
  const [token, setToken] = useState<string>("")
  const graphRef = useRef(null)
  const fileInputRef = useRef(null)
  const { toast } = useToast()

  // --- ENTITY COLORS MAP ---
  const ENTITY_COLORS = {
    'COURT': "#bbabf2",
    'PETITIONER': "#f570ea",
    'RESPONDENT': "#cdee81",
    'JUDGE': "#fdd8a5",
    'LAWYER': "#f9d380",
    'WITNESS': "violet",
    'STATUTE': "#faea99",
    'PROVISION': "yellow",
    'CASE_NUMBER': "#fbb1cf",
    'PRECEDENT': "#fad6d6",
    'DATE': "#b1ecf7",
    'OTHER_PERSON': "#b0f6a2",
    'ORG': '#a57db5',
    'GPE': '#7fdbd4'
  };

  // Override node color function to use ENTITY_COLORS, normalizing type
  const getNodeColor = (node: any) => {
    if (!node) return "#6b7280"
    // Normalize type: uppercase, remove spaces/underscores
    let type = node.type
    if (typeof type === 'string') {
      type = type.replace(/\s+/g, '_').replace(/-/g, '_').toUpperCase()
    }
    return ENTITY_COLORS[type] || "#6b7280"
  }

  useEffect(() => {
    setToken(localStorage.getItem("token") || "")
  }, [])

  useEffect(() => {
    if (!graphData) return
    
    if (filterType === "all") {
      setFilteredData(graphData)
      return
    }
    
    const filteredNodes = graphData.nodes.filter(node => 
      filterType === "all" || node.type === filterType
    )
    
    const nodeIds = new Set(filteredNodes.map(node => node.id))
    
    const filteredLinks = graphData.links.filter(link => 
      nodeIds.has(link.source.id || link.source) && 
      nodeIds.has(link.target.id || link.target)
    )
    
    setFilteredData({
      nodes: filteredNodes,
      links: filteredLinks
    })
  }, [filterType, graphData])

  const fetchGraph = async (data) => {
    try {
      setIsLoading(true)
      
      const transformedData = {
        nodes: data.nodes.map(node => ({
          id: node.id,
          label: node.label,
          type: node.type,
          description: node.normalized_value || node.label,
          centrality: node.centrality || 0.5,
          community: node.community || 0,
          val: (node.type === 'document' ? 3 : 1) * (node.centrality || 0.5) + 1
        })),
        links: data.edges.map(edge => ({
          source: edge.source,
          target: edge.target,
          label: edge.label,
          weight: edge.weight || 1,
          confidence: edge.confidence || 1
        }))
      }
      
      setGraphData(transformedData)
      setFilteredData(transformedData)
      setGraphInfo({
        id: data.id,
        name: data.name,
        domain: data.domain || "legal",
        nodeCount: data.node_count || transformedData.nodes.length,
        edgeCount: data.edge_count || transformedData.links.length,
        communities: data.communities || {},
        keyEntities: data.key_entities || [],
        entityTypes: data.entity_types || {}
      })
      
      localStorage.setItem("lastGraphId", data.id)
      
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching graph:", error)
      toast({
        title: "Error",
        description: "Failed to load knowledge graph",
        variant: "destructive"
      })
      setIsLoading(false)
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive"
      })
      return
    }

    try {
      setIsLoading(true)
      setUploadModalOpen(false)
      
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('domain', graphDomain)
      
      const uploadResponse= await uploadDocument(selectedFile, token)
      console.log(uploadResponse)
      const documentId = uploadResponse.document._id
      console.log(documentId)
      const payload ={document_id:documentId,graph_type:"concept",domain:graphDomain}
      const graphResponse = await create_graph(payload,token) 
      console.log(graphResponse)
      if (!graphResponse) {
        throw new Error("Failed to generate knowledge graph")
      }
      
      let graphData = graphResponse

      const OPENROUTER_API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || "";
      const OPENROUTER_API_URL = process.env.NEXT_PUBLIC_OPENROUTER_API_URL || "https://openrouter.ai/api/v1/chat/completions";
      const OPENROUTER_MODEL = process.env.NEXT_PUBLIC_OPENROUTER_MODEL || "openchat/openchat-3.5-0106";

      try {
        const enhancedGraph = await enhanceGraphWithLLM(graphData,selectedFile, OPENROUTER_API_KEY, OPENROUTER_API_URL, OPENROUTER_MODEL);
        if (enhancedGraph && enhancedGraph.nodes && enhancedGraph.edges) {
          graphData = enhancedGraph;
          console.log('helll')
          toast({ title: "Graph Enhanced", description: "Graph enhanced using LLM (OpenRouter)" });
        }
      } catch (e: any) {
        toast({ title: "LLM Enhancement Failed", description: e.message, variant: "destructive" });
      }

      await fetchGraph(graphData)
      
      toast({
        title: "Success",
        description: "Knowledge graph generated successfully",
      })
      
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      
    } catch (error) {
      console.error("Error uploading and processing file:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to process document",
        variant: "destructive"
      })
      setIsLoading(false)
    }
  }

  const handleNodeClick = (node) => {
    setSelectedNode(node)
  }

  const handleZoomIn = () => {
    if (graphRef.current && zoomLevel < 2) {
      const newZoom = Math.min(zoomLevel + 0.1, 2)
      setZoomLevel(newZoom)
      graphRef.current.cameraPosition({ z: 1000 / newZoom }, null, 3000)
    }
  }

  const handleZoomOut = () => {
    if (graphRef.current && zoomLevel > 0.5) {
      const newZoom = Math.max(zoomLevel - 0.1, 0.5)
      setZoomLevel(newZoom)
      graphRef.current.cameraPosition({ z: 1000 / newZoom }, null, 3000)
    }
  }

  const handleZoomChange = (value) => {
    if (graphRef.current) {
      const newZoom = value[0]
      setZoomLevel(newZoom)
      graphRef.current.cameraPosition({ z: 1000 / newZoom }, null, 1000)
    }
  }

  const handleResetGraph = () => {
    if (graphRef.current) {
      graphRef.current.cameraPosition({ x: 0, y: 0, z: 1000 }, { x: 0, y: 0, z: 0 }, 1000)
      setZoomLevel(1)
      setSelectedNode(null)
    }
  }

  const downloadGraph = () => {
    if (!graphData || !graphInfo) return
    
    const dataStr = JSON.stringify(graphData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `${graphInfo.name || 'knowledge-graph'}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
  
  return (
    <div className="min-h-screen py-12 px-4 bg-black text-white">
      <motion.h1
        className="text-4xl font-bold text-center mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        3D Knowledge Graph Visualization
      </motion.h1>

      <motion.p
        className="text-center text-muted-foreground max-w-2xl mx-auto mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        Upload legal documents and explore their relationships in an interactive 3D graph.
      </motion.p>

      {/* Action buttons row */}
      <div className="flex justify-center mb-8 gap-4">
        <Button 
          variant="default" 
          onClick={() => setUploadModalOpen(true)}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload Document
        </Button>
        
        <Button
          variant="outline"
          onClick={() => setShowInfoPanel(!showInfoPanel)}
          className="gap-2"
        >
          <Info className="h-4 w-4" />
          {showInfoPanel ? "Hide" : "Show"} Graph Info
        </Button>
        
        <Button
          variant="outline"
          onClick={downloadGraph}
          disabled={!graphData}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Export Graph
        </Button>
      </div>

      {/* --- ENTITY FILTER --- */}
      <div className="flex items-center justify-center mb-4">
        <label htmlFor="entity-filter" className="mr-2 font-medium">Entity Type:</label>
        <select
          id="entity-filter"
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="all">All</option>
          {Object.keys(ENTITY_COLORS).map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      {/* --- ENTITY COLOR LEGEND --- */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
        {Object.entries(ENTITY_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1">
            <span
              style={{
                display: 'inline-block',
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: color,
                border: '1px solid #fff',
                marginRight: 4
              }}
              title={type}
            />
            <span className="text-xs" style={{textShadow: '0 1px 3px #000'}}>{type}</span>
          </div>
        ))}
      </div>

      {/* Main layout with optional info panel */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Graph info panel - shown when toggled */}
          {showInfoPanel && graphInfo && (
            <motion.div
              className="lg:col-span-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="bg-[#0a0d1a] text-white p-6 rounded-xl shadow w-full max-w-xs mb-6">
                <h2 className="text-xl font-bold mb-4">Graph Information</h2>
                <div className="mb-2">
                  <span className="block text-xs text-gray-400">Name</span>
                  <span className="text-sm font-medium">{graphInfo?.name || '-'}</span>
                </div>
                <div className="mb-2">
                  <span className="block text-xs text-gray-400">Domain</span>
                  <span className="inline-block bg-[#13182c] px-2 py-1 rounded text-xs">{graphInfo?.domain || '-'}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <div>
                    <span className="block text-xs text-gray-400">Nodes</span>
                    <span className="font-semibold">{graphInfo?.nodeCount ?? '-'}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-400">Relationships</span>
                    <span className="font-semibold">{graphInfo?.edgeCount ?? '-'}</span>
                  </div>
                </div>
                <Separator className="my-2" />
                <div className="mb-2">
                  <span className="block font-semibold text-xs mb-1">Key Entities</span>
                  {graphInfo?.keyEntities && graphInfo.keyEntities.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1">
                      {graphInfo.keyEntities.map((entity, idx) => (
                        <li key={idx} className="text-xs">
                          <span className="font-medium">{entity.label || entity}</span>
                          {entity.type && (
                            <span className="ml-2 px-2 py-0.5 rounded text-xs" style={{ background: ENTITY_COLORS[(typeof entity.type === 'string' ? entity.type.replace(/\s+/g, '_').replace(/-/g, '_').toUpperCase() : entity.type)] || '#222', color: '#000' }}>{entity.type}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-xs text-gray-400">No key entities found</span>
                  )}
                </div>
                <div className="mb-2">
                  <span className="block font-semibold text-xs mb-1">Entity Types</span>
                  {graphInfo?.entityTypes && Object.keys(graphInfo.entityTypes).length > 0 ? (
                    <ul className="flex flex-wrap gap-2">
                      {Object.entries(graphInfo.entityTypes).map(([type, count]) => (
                        <li key={type} className="flex items-center gap-1 text-xs">
                          <span className="inline-block w-3 h-3 rounded-full" style={{ background: ENTITY_COLORS[(typeof type === 'string' ? type.replace(/\s+/g, '_').replace(/-/g, '_').toUpperCase() : type)] || '#fff' }}></span>
                          <span>{type} ({count})</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-xs text-gray-400">No entity types found</span>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* 3D Graph visualization */}
          <div className={`${showInfoPanel ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
            <div className="relative">
              {/* Graph controls */}
              <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="outline" onClick={handleZoomIn}>
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Zoom In</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="outline" onClick={handleZoomOut}>
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Zoom Out</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="outline" onClick={handleResetGraph}>
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Reset View</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Zoom slider */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 bg-background/80 backdrop-blur-sm rounded-full px-4 py-2 flex items-center space-x-2 border border-primary/20">
                <ZoomOut className="h-4 w-4 text-muted-foreground" />
                <Slider 
                  value={[zoomLevel]} 
                  min={0.5} 
                  max={2} 
                  step={0.1} 
                  onValueChange={handleZoomChange} 
                  className="w-32" 
                />
                <ZoomIn className="h-4 w-4 text-muted-foreground" />
              </div>

              <motion.div
                className="w-full h-[600px] bg-background rounded-lg shadow-lg overflow-hidden border border-primary/20"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                {isLoading ? (
                  <div className="h-full flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
                    <p className="text-muted-foreground text-sm">Processing document and generating graph...</p>
                  </div>
                ) : filteredData ? (
                  <div className="flex justify-center items-center w-full h-[600px]">
                    <ForceGraph3D
                      ref={graphRef}
                      graphData={filteredData}
                      nodeAutoColorBy={null}
                      nodeLabel={node => `${node.label} (${node.type})`}
                      nodeColor={getNodeColor}
                      linkLabel={link => link.label}
                      linkDirectionalArrowLength={4}
                      linkDirectionalArrowRelPos={1}
                      linkCurvature={0.25}
                      backgroundColor="#000"
                      width={900}
                      height={600}
                      onNodeClick={handleNodeClick}
                      enableNodeDrag={true}
                      d3VelocityDecay={0.3}
                      d3AlphaMin={0.001}
                      d3Force="center"
                    />
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                    <h3 className="text-lg font-semibold mb-4">No Knowledge Graph Available</h3>
                    <p className="text-muted-foreground mb-6">
                      Upload a document to generate a 3D knowledge graph visualization
                    </p>
                    <Button 
                      onClick={() => setUploadModalOpen(true)}
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Upload Document
                    </Button>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Node details panel */}
            <AnimatePresence>
              {selectedNode && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="mt-4"
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="text-lg font-semibold">{selectedNode.label}</h3>
                          <div className="flex items-center">
                            <Badge variant="outline" className="mr-2">
                              {selectedNode.type}
                            </Badge>
                            {selectedNode.centrality !== undefined && (
                              <span className="text-xs text-muted-foreground">
                                Centrality: {selectedNode.centrality.toFixed(2)}
                              </span>
                            )}
                          </div>
                          {selectedNode.description && (
                            <p className="text-sm text-muted-foreground pt-2">{selectedNode.description}</p>
                          )}
                        </div>
                        <div className="w-8 h-8 rounded-full" style={{ backgroundColor: getNodeColor(selectedNode) }} />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* --- NODES TAB --- */}
      <div className="max-w-4xl mx-auto mt-6">
        <Tabs defaultValue="nodes" className="w-full">
          <TabsList className="w-full flex justify-center">
            <TabsTrigger value="nodes">Nodes</TabsTrigger>
          </TabsList>
          <TabsContent value="nodes">
            <div className="overflow-x-auto rounded bg-black/80 p-4 border border-gray-700">
              <table className="min-w-full text-xs">
                <thead>
                  <tr>
                    <th className="px-2 py-1 text-left">Label</th>
                    <th className="px-2 py-1 text-left">Type</th>
                    <th className="px-2 py-1 text-left">ID</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData && filteredData.nodes.map(node => (
                    <tr key={node.id} className="border-b border-gray-700">
                      <td className="px-2 py-1">{node.label}</td>
                      <td className="px-2 py-1">
                        <span style={{ color: ENTITY_COLORS[node.type] || '#fff' }}>{node.type}</span>
                      </td>
                      <td className="px-2 py-1">{node.id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Upload modal */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a document to generate a knowledge graph visualization.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="file">Document File</Label>
              <Input 
                id="file" 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange} 
                accept=".pdf,.txt,.doc,.docx" 
              />
              <p className="text-xs text-muted-foreground">
                Supported formats: PDF, TXT, DOC, DOCX
              </p>
            </div>
            
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="domain">Document Domain</Label>
              <Select value={graphDomain} onValueChange={setGraphDomain}>
                <SelectTrigger id="domain">
                  <SelectValue placeholder="Select domain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="legal">Legal</SelectItem>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="medical">Medical</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Selecting the right domain improves entity extraction
              </p>
            </div>
          </div>
          
          <DialogFooter className="flex space-x-2 sm:justify-end">
            <Button variant="outline" onClick={() => setUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleUpload} disabled={!selectedFile}>
              Upload and Process
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}