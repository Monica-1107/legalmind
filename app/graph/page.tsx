"use client"

import { useEffect, useState, useRef } from "react"
import dynamic from "next/dynamic"
import { motion } from "framer-motion"
import { ZoomIn, ZoomOut, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Dynamically import ForceGraph to avoid SSR issues
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false })

export default function KnowledgeGraph() {
  const [graphData, setGraphData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const graphRef = useRef(null)

  useEffect(() => {
    setIsLoading(true)

    // Simulated graph data - in a real app, this would come from an API
    const data = {
      nodes: [
        {
          id: "Contract Law",
          group: 1,
          size: 15,
          description: "Body of law that governs making and enforcing agreements",
        },
        {
          id: "Offer",
          group: 1,
          size: 10,
          description: "A promise that is dependent on a requested act, forbearance, or return promise",
        },
        { id: "Acceptance", group: 1, size: 10, description: "Agreement to the terms of an offer" },
        { id: "Consideration", group: 1, size: 10, description: "Something of value exchanged for a promise" },
        {
          id: "Criminal Law",
          group: 2,
          size: 15,
          description: "Body of law that defines criminal offenses and their punishments",
        },
        { id: "Mens Rea", group: 2, size: 10, description: "The mental element of a crime; guilty mind" },
        { id: "Actus Reus", group: 2, size: 10, description: "The physical element of a crime; guilty act" },
        {
          id: "Constitutional Law",
          group: 3,
          size: 15,
          description: "Body of law defining the relationship of different entities within a state",
        },
        {
          id: "Due Process",
          group: 3,
          size: 10,
          description: "Legal requirement that the state must respect all legal rights owed to a person",
        },
        {
          id: "Equal Protection",
          group: 3,
          size: 10,
          description: "Principle that each person is entitled to equal protection of the laws",
        },
      ],
      links: [
        { source: "Contract Law", target: "Offer", value: 5 },
        { source: "Contract Law", target: "Acceptance", value: 5 },
        { source: "Contract Law", target: "Consideration", value: 5 },
        { source: "Criminal Law", target: "Mens Rea", value: 5 },
        { source: "Criminal Law", target: "Actus Reus", value: 5 },
        { source: "Constitutional Law", target: "Due Process", value: 5 },
        { source: "Constitutional Law", target: "Equal Protection", value: 5 },
      ],
    }

    // Simulate API delay
    setTimeout(() => {
      setGraphData(data)
      setIsLoading(false)
    }, 1500)
  }, [])

  const handleNodeClick = (node) => {
    setSelectedNode(node)
  }

  const handleZoomIn = () => {
    if (graphRef.current && zoomLevel < 2) {
      const newZoom = Math.min(zoomLevel + 0.1, 2)
      setZoomLevel(newZoom)
      graphRef.current.zoom(newZoom)
    }
  }

  const handleZoomOut = () => {
    if (graphRef.current && zoomLevel > 0.5) {
      const newZoom = Math.max(zoomLevel - 0.1, 0.5)
      setZoomLevel(newZoom)
      graphRef.current.zoom(newZoom)
    }
  }

  const handleZoomChange = (value) => {
    if (graphRef.current) {
      const newZoom = value[0]
      setZoomLevel(newZoom)
      graphRef.current.zoom(newZoom)
    }
  }

  const handleResetGraph = () => {
    if (graphRef.current) {
      graphRef.current.centerAt()
      graphRef.current.zoom(1)
      setZoomLevel(1)
      setSelectedNode(null)
    }
  }

  const getNodeColor = (node) => {
    const colors = {
      1: "#4f46e5", // Indigo for Contract Law
      2: "#10b981", // Emerald for Criminal Law
      3: "#f59e0b", // Amber for Constitutional Law
    }
    return colors[node.group] || "#6b7280"
  }

  return (
    <div className="min-h-screen py-20 px-4">
      <motion.h1
        className="text-4xl font-playfair text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Legal Knowledge Graph
      </motion.h1>

      <motion.p
        className="text-center text-muted-foreground max-w-2xl mx-auto mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        Explore the relationships between different legal concepts. Click on nodes to see details.
      </motion.p>

      <div className="relative max-w-6xl mx-auto">
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
          <Slider value={[zoomLevel]} min={0.5} max={2} step={0.1} onValueChange={handleZoomChange} className="w-32" />
          <ZoomIn className="h-4 w-4 text-muted-foreground" />
        </div>

        <motion.div
          className="w-full h-[600px] bg-background rounded-lg shadow-lg overflow-hidden border border-primary/20"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ForceGraph2D
              ref={graphRef}
              graphData={graphData}
              backgroundColor="rgba(0,0,0,0)"
              nodeColor={(node) => getNodeColor(node)}
              nodeLabel={(node) => node.id}
              nodeRelSize={6}
              nodeVal={(node) => node.size}
              linkWidth={(link) => link.value * 0.5}
              linkColor={() => "rgba(156, 163, 175, 0.5)"}
              onNodeClick={handleNodeClick}
              cooldownTicks={100}
              width={800}
              height={600}
            />
          )}
        </motion.div>

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
                    <div>
                      <h3 className="text-lg font-semibold">{selectedNode.id}</h3>
                      <p className="text-muted-foreground">{selectedNode.description}</p>
                    </div>
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: getNodeColor(selectedNode) }} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

