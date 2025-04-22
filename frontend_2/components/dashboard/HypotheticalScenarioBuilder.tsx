"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, FileText, Download, BarChart3 } from "lucide-react"

export function HypotheticalScenarioBuilder() {
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null)
  const [scenario, setScenario] = useState({
    facts: "",
    arguments: "",
    precedents: "",
  })

  const documents = [
    { id: "doc1", name: "Smith v. Johnson.pdf", date: "2023-05-15" },
    { id: "doc2", name: "Contract_Review_2023.docx", date: "2023-06-22" },
    { id: "doc3", name: "Legal_Brief_Draft.pdf", date: "2023-07-10" },
  ]

  const handleAnalyze = () => {
    if (!selectedDocument) return

    setIsLoading(true)

    // Simulate analysis delay
    setTimeout(() => {
      setIsLoading(false)
      setShowResults(true)
    }, 2000)
  }

  const resetAnalysis = () => {
    setShowResults(false)
    setScenario({
      facts: "",
      arguments: "",
      precedents: "",
    })
  }

  return (
    <div className="space-y-6">
      <Card className="bg-navy-800/50 border-gold-500/20">
        <CardHeader>
          <CardTitle className="text-xl font-medium text-gold-500">Interactive Hypothetical Scenario Builder</CardTitle>
          <p className="text-sm text-gray-400">
            Modify key elements of case documents and receive AI-generated analysis of how these changes might affect
            legal outcomes
          </p>
        </CardHeader>
        <CardContent>
          {!showResults ? (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Step 1: Select a Document</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {documents.map((doc) => (
                    <motion.div
                      key={doc.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedDocument === doc.id
                          ? "bg-gold-500/20 border-gold-500"
                          : "bg-navy-700/50 border-navy-600 hover:border-gold-500/50"
                      }`}
                      onClick={() => setSelectedDocument(doc.id)}
                    >
                      <div className="flex items-start">
                        <FileText className="h-5 w-5 mr-2 text-gray-400" />
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-xs text-gray-500">{doc.date}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {selectedDocument && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Step 2: Modify Scenario Elements</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Modified Facts</label>
                      <Textarea
                        placeholder="Describe how the facts of the case would be different..."
                        className="h-32 bg-navy-700 border-navy-600 focus:border-gold-500"
                        value={scenario.facts}
                        onChange={(e) => setScenario({ ...scenario, facts: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Modified Arguments</label>
                      <Textarea
                        placeholder="Describe how the legal arguments would change..."
                        className="h-32 bg-navy-700 border-navy-600 focus:border-gold-500"
                        value={scenario.arguments}
                        onChange={(e) => setScenario({ ...scenario, arguments: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Modified Precedents</label>
                      <Textarea
                        placeholder="Describe different precedents that might apply..."
                        className="h-32 bg-navy-700 border-navy-600 focus:border-gold-500"
                        value={scenario.precedents}
                        onChange={(e) => setScenario({ ...scenario, precedents: e.target.value })}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleAnalyze}
                    disabled={isLoading}
                    className="bg-gold-500 hover:bg-gold-600 text-navy-900"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>Analyze Hypothetical Scenario</>
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Analysis Results</h3>
                <Button variant="outline" size="sm" onClick={resetAnalysis}>
                  Create New Scenario
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-navy-700/50 border-navy-600">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">Original Case Outcome</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gold-500">Summary</h4>
                      <p className="text-sm">
                        The original case would likely result in a judgment for the plaintiff, with damages awarded for
                        breach of contract.
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gold-500">Key Factors</h4>
                      <ul className="text-sm list-disc list-inside space-y-1">
                        <li>Valid contract was established</li>
                        <li>Clear evidence of breach by defendant</li>
                        <li>Damages are quantifiable and reasonable</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gold-500">Probability</h4>
                      <div className="flex items-center mt-1">
                        <div className="w-full bg-navy-800 rounded-full h-2.5">
                          <div className="bg-green-500 h-2.5 rounded-full" style={{ width: "75%" }}></div>
                        </div>
                        <span className="ml-2 text-sm font-medium">75%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-navy-700/50 border-navy-600">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">Hypothetical Scenario Outcome</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gold-500">Summary</h4>
                      <p className="text-sm">
                        With the modified elements, the case would likely result in a judgment for the defendant, with
                        the contract deemed unenforceable.
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gold-500">Key Factors</h4>
                      <ul className="text-sm list-disc list-inside space-y-1">
                        <li>Modified facts show lack of consideration</li>
                        <li>New precedents support defendant's position</li>
                        <li>Modified arguments demonstrate contract ambiguity</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gold-500">Probability</h4>
                      <div className="flex items-center mt-1">
                        <div className="w-full bg-navy-800 rounded-full h-2.5">
                          <div className="bg-red-500 h-2.5 rounded-full" style={{ width: "30%" }}></div>
                        </div>
                        <span className="ml-2 text-sm font-medium">30%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-navy-700/50 border-navy-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">Detailed Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gold-500">Modified Facts Impact</h4>
                      <p className="text-sm">
                        {scenario.facts || "No modifications to facts were provided."}
                        {scenario.facts && (
                          <span className="block mt-2">
                            This change significantly alters the foundation of the case by challenging the existence of
                            a valid agreement between parties.
                          </span>
                        )}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gold-500">Modified Arguments Impact</h4>
                      <p className="text-sm">
                        {scenario.arguments || "No modifications to arguments were provided."}
                        {scenario.arguments && (
                          <span className="block mt-2">
                            These new arguments introduce doubt regarding the enforceability of key contract provisions.
                          </span>
                        )}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gold-500">Modified Precedents Impact</h4>
                      <p className="text-sm">
                        {scenario.precedents || "No modifications to precedents were provided."}
                        {scenario.precedents && (
                          <span className="block mt-2">
                            The introduction of these precedents establishes a different legal framework for evaluating
                            the case.
                          </span>
                        )}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gold-500">Educational Insights</h4>
                      <p className="text-sm">
                        This scenario demonstrates how changes to fundamental contract elements can dramatically alter
                        case outcomes. The modified scenario highlights the importance of consideration in contract
                        formation and how precedent selection influences judicial interpretation.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end space-x-4">
                <Button variant="outline" className="flex items-center">
                  <Download className="mr-2 h-4 w-4" />
                  Export Analysis
                </Button>
                <Button className="bg-gold-500 hover:bg-gold-600 text-navy-900 flex items-center">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Detailed Statistics
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

