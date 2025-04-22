"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, FileText, Download, ChevronDown, ChevronUp, ExternalLink } from "lucide-react"

export function HierarchicalAnalysis() {
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [activeLayer, setActiveLayer] = useState<1 | 2 | 3>(1)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    summary: true,
    arguments: false,
    precedents: false,
    statutes: false,
    procedural: false,
  })

  const documents = [
    { id: "doc1", name: "Smith v. Johnson.pdf", date: "2023-05-15" },
    { id: "doc2", name: "Contract_Review_2023.docx", date: "2023-06-22" },
    { id: "doc3", name: "Legal_Brief_Draft.pdf", date: "2023-07-10" },
  ]

  const handleAnalyze = () => {
    if (!selectedDocument) return

    setIsAnalyzing(true)

    // Simulate analysis delay
    setTimeout(() => {
      setIsAnalyzing(false)
      setAnalysisComplete(true)
    }, 2000)
  }

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const resetAnalysis = () => {
    setAnalysisComplete(false)
    setSelectedDocument(null)
    setActiveLayer(1)
  }

  return (
    <div className="space-y-6">
      <Card className="bg-navy-800/50 border-gold-500/20">
        <CardHeader>
          <CardTitle className="text-xl font-medium text-gold-500">Hierarchical Analysis System</CardTitle>
          <p className="text-sm text-gray-400">
            Multi-layered analysis of legal documents with increasing depth and complexity
          </p>
        </CardHeader>
        <CardContent>
          {!analysisComplete ? (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Select a Document to Analyze</h3>
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
                  <h3 className="text-lg font-medium">Select Analysis Preferences</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Default Display Level</label>
                      <div className="grid grid-cols-3 gap-4 mt-2">
                        <Button
                          variant={activeLayer === 1 ? "default" : "outline"}
                          className={activeLayer === 1 ? "bg-gold-500 text-navy-900" : ""}
                          onClick={() => setActiveLayer(1)}
                        >
                          Layer 1<span className="text-xs block">Executive Summary</span>
                        </Button>
                        <Button
                          variant={activeLayer === 2 ? "default" : "outline"}
                          className={activeLayer === 2 ? "bg-gold-500 text-navy-900" : ""}
                          onClick={() => setActiveLayer(2)}
                        >
                          Layer 2<span className="text-xs block">Detailed Breakdown</span>
                        </Button>
                        <Button
                          variant={activeLayer === 3 ? "default" : "outline"}
                          className={activeLayer === 3 ? "bg-gold-500 text-navy-900" : ""}
                          onClick={() => setActiveLayer(3)}
                        >
                          Layer 3<span className="text-xs block">Comprehensive Review</span>
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="bg-gold-500 hover:bg-gold-600 text-navy-900"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing Document...
                      </>
                    ) : (
                      <>Start Hierarchical Analysis</>
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Analysis Results</h3>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center bg-navy-700 rounded-lg p-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`rounded-md ${activeLayer === 1 ? "bg-gold-500 text-navy-900" : ""}`}
                      onClick={() => setActiveLayer(1)}
                    >
                      Layer 1
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`rounded-md ${activeLayer === 2 ? "bg-gold-500 text-navy-900" : ""}`}
                      onClick={() => setActiveLayer(2)}
                    >
                      Layer 2
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`rounded-md ${activeLayer === 3 ? "bg-gold-500 text-navy-900" : ""}`}
                      onClick={() => setActiveLayer(3)}
                    >
                      Layer 3
                    </Button>
                  </div>
                  <Button variant="outline" size="sm" onClick={resetAnalysis}>
                    New Analysis
                  </Button>
                </div>
              </div>

              <div className="bg-navy-700/50 border border-navy-600 rounded-lg">
                <div className="p-4 border-b border-navy-600 flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Smith v. Johnson.pdf</h3>
                    <p className="text-xs text-gray-400">Analyzed on November 15, 2023</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-gold-500/20 text-gold-500 px-2 py-1 rounded">
                      {activeLayer === 1
                        ? "Executive Summary"
                        : activeLayer === 2
                          ? "Detailed Breakdown"
                          : "Comprehensive Review"}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  {/* Layer 1: Executive Summary */}
                  {activeLayer === 1 && (
                    <div className="prose prose-sm prose-invert max-w-none">
                      <p>
                        This case involves a contract dispute between Smith Enterprises and Johnson Manufacturing. The
                        plaintiff (Smith) alleges breach of contract regarding a supply agreement for specialized
                        components. Based on the evidence presented, there appears to be a valid contract with clear
                        terms that were not fulfilled by the defendant (Johnson). The primary legal issues center on
                        contract interpretation and the applicability of force majeure provisions.
                      </p>
                      <p>
                        Key points of contention include delivery timelines, quality specifications, and whether market
                        disruptions constitute an excusable delay under the contract terms. The case has moderate
                        complexity with straightforward application of contract law principles.
                      </p>
                    </div>
                  )}

                  {/* Layer 2: Detailed Breakdown */}
                  {activeLayer === 2 && (
                    <div className="space-y-4">
                      <div>
                        <button
                          className="flex items-center justify-between w-full text-left font-medium text-gold-500"
                          onClick={() => toggleSection("summary")}
                        >
                          <span>Case Summary</span>
                          {expandedSections.summary ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        {expandedSections.summary && (
                          <div className="mt-2 pl-4 border-l-2 border-navy-600">
                            <p className="text-sm">
                              Smith Enterprises (plaintiff) entered into a supply agreement with Johnson Manufacturing
                              (defendant) on March 15, 2022. The agreement stipulated that Johnson would deliver 10,000
                              specialized components monthly at $45 per unit, meeting specific quality standards
                              outlined in Appendix A of the contract. Deliveries were to begin on May 1, 2022.
                            </p>
                            <p className="text-sm mt-2">
                              Johnson failed to meet delivery schedules starting in July 2022, citing supply chain
                              disruptions. When deliveries resumed in September 2022, Smith alleges that approximately
                              40% of components failed to meet quality specifications. Smith terminated the contract on
                              October 30, 2022, and filed suit seeking damages of $1.2 million for breach of contract.
                            </p>
                          </div>
                        )}
                      </div>

                      <div>
                        <button
                          className="flex items-center justify-between w-full text-left font-medium text-gold-500"
                          onClick={() => toggleSection("arguments")}
                        >
                          <span>Main Arguments</span>
                          {expandedSections.arguments ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        {expandedSections.arguments && (
                          <div className="mt-2 pl-4 border-l-2 border-navy-600">
                            <div className="mb-2">
                              <h4 className="text-sm font-medium">Plaintiff's Position:</h4>
                              <ul className="list-disc list-inside text-sm">
                                <li>Valid contract with clear terms was established</li>
                                <li>Defendant failed to meet delivery schedules without justification</li>
                                <li>Delivered components failed to meet contractual quality standards</li>
                                <li>Force majeure clause does not apply as supply issues were foreseeable</li>
                              </ul>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium">Defendant's Position:</h4>
                              <ul className="list-disc list-inside text-sm">
                                <li>Supply chain disruptions constitute force majeure under Section 14.2</li>
                                <li>Quality issues were within acceptable tolerance ranges</li>
                                <li>Plaintiff failed to provide timely notification of quality concerns</li>
                                <li>Damages claimed are speculative and not supported by evidence</li>
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <button
                          className="flex items-center justify-between w-full text-left font-medium text-gold-500"
                          onClick={() => toggleSection("precedents")}
                        >
                          <span>Critical Precedents</span>
                          {expandedSections.precedents ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        {expandedSections.precedents && (
                          <div className="mt-2 pl-4 border-l-2 border-navy-600">
                            <ul className="space-y-2 text-sm">
                              <li>
                                <span className="font-medium">
                                  Eastern Supply Co. v. Westbrook Manufacturing (2019)
                                </span>
                                <p>
                                  Established that global supply chain disruptions may qualify as force majeure events
                                  only if specifically enumerated in contract language.
                                </p>
                              </li>
                              <li>
                                <span className="font-medium">Quality Systems Inc. v. Precision Components (2020)</span>
                                <p>
                                  Defined standards for quality compliance in manufacturing contracts and notification
                                  requirements for defects.
                                </p>
                              </li>
                              <li>
                                <span className="font-medium">Reliable Shipping v. Global Distributors (2018)</span>
                                <p>
                                  Addressed calculation of damages in cases of partial performance of supply contracts.
                                </p>
                              </li>
                            </ul>
                          </div>
                        )}
                      </div>

                      <div>
                        <button
                          className="flex items-center justify-between w-full text-left font-medium text-gold-500"
                          onClick={() => toggleSection("procedural")}
                        >
                          <span>Procedural History</span>
                          {expandedSections.procedural ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        {expandedSections.procedural && (
                          <div className="mt-2 pl-4 border-l-2 border-navy-600 text-sm">
                            <ul className="space-y-1">
                              <li>November 15, 2022: Complaint filed in District Court</li>
                              <li>January 10, 2023: Defendant's motion to dismiss denied</li>
                              <li>March-June 2023: Discovery phase</li>
                              <li>July 25, 2023: Plaintiff's motion for summary judgment denied</li>
                              <li>September 18, 2023: Pre-trial conference</li>
                              <li>Trial scheduled for December 5, 2023</li>
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Layer 3: Comprehensive Review */}
                  {activeLayer === 3 && (
                    <div className="space-y-6">
                      <div className="prose prose-sm prose-invert max-w-none">
                        <h3>I. Introduction and Factual Background</h3>
                        <p>
                          This case presents a complex commercial dispute arising from a manufacturing supply agreement
                          executed on March 15, 2022, between Smith Enterprises ("Smith" or "Plaintiff") and Johnson
                          Manufacturing ("Johnson" or "Defendant"). The agreement (hereinafter "the Contract") was
                          formalized after three months of negotiations and contained detailed provisions regarding
                          product specifications, delivery schedules, quality control protocols, and remedies for
                          non-compliance.
                        </p>
                        <p>
                          Under the terms of the Contract, Johnson agreed to manufacture and deliver 10,000 specialized
                          electronic components monthly at a unit price of $45, with deliveries commencing on May 1,
                          2022. The components were intended for integration into Smith's flagship product line of
                          medical devices, with Smith's production schedules and customer commitments contingent upon
                          timely receipt of conforming goods.
                        </p>
                        <p>
                          The initial deliveries in May and June 2022 proceeded without incident. However, beginning in
                          July 2022, Johnson failed to meet the agreed-upon delivery schedule, providing only partial
                          shipments (approximately 40-60% of required volume). Johnson attributed these shortfalls to
                          "unprecedented supply chain disruptions affecting semiconductor availability," invoking
                          Section 14.2 of the Contract (Force Majeure clause).
                        </p>
                        <p>
                          When deliveries resumed at full volume in September 2022, Smith's quality control department
                          identified significant defects in approximately 40% of the components, rendering them
                          unsuitable for their intended purpose. Smith provided written notification of these
                          deficiencies on September 25, 2022, as required by Section 8.3 of the Contract. Johnson
                          disputed the findings, asserting that the components were within acceptable tolerance ranges
                          as defined in Appendix A.
                        </p>
                        <p>
                          After unsuccessful attempts to resolve the dispute through the Contract's escalation
                          procedures, Smith terminated the agreement on October 30, 2022, citing material breach under
                          Sections 12.1(a) and 12.1(c). Smith subsequently filed this action on November 15, 2022,
                          seeking damages of $1.2 million, calculated based on increased procurement costs, production
                          delays, and lost sales.
                        </p>

                        <h3>II. Legal Issues Presented</h3>
                        <ol>
                          <li>
                            Whether Johnson's failure to meet delivery schedules constitutes a material breach of the
                            Contract.
                          </li>
                          <li>
                            Whether the supply chain disruptions cited by Johnson qualify as force majeure events under
                            Section 14.2 of the Contract.
                          </li>
                          <li>
                            Whether the delivered components failed to meet the quality specifications set forth in the
                            Contract.
                          </li>
                          <li>
                            Whether Smith provided timely and adequate notice of alleged quality deficiencies as
                            required by the Contract.
                          </li>
                          <li>Whether Smith's termination of the Contract was valid under Section 12.</li>
                          <li>The appropriate measure of damages if breach is established.</li>
                        </ol>

                        <h3>III. Analysis of Applicable Law</h3>

                        <h4>A. Contract Formation and Interpretation</h4>
                        <p>
                          The Contract between Smith and Johnson satisfies all requirements for an enforceable agreement
                          under the Uniform Commercial Code (UCC) as adopted in this jurisdiction. It contains definite
                          terms regarding subject matter, quantity, price, delivery schedules, and quality
                          specifications. Both parties are sophisticated commercial entities represented by counsel
                          during negotiations, and there are no allegations of procedural or substantive
                          unconscionability.
                        </p>
                        <p>
                          Under UCC § 2-601, a buyer may reject goods that fail to conform to the contract in any
                          respect. However, UCC § 2-605 requires the buyer to specify defects that are ascertainable by
                          reasonable inspection when rejecting goods. Smith's notification on September 25, 2022,
                          appears to satisfy this requirement, as it detailed specific quality issues with reference to
                          contractual standards.
                        </p>

                        <h4>B. Force Majeure Doctrine</h4>
                        <p>
                          Section 14.2 of the Contract defines force majeure events as "acts, events, or circumstances
                          beyond the reasonable control of the affected party that could not have been prevented through
                          the exercise of reasonable diligence." The provision specifically enumerates "natural
                          disasters, acts of government, labor strikes, and national emergencies" as qualifying events,
                          but does not explicitly mention supply chain disruptions or material shortages.
                        </p>
                        <p>
                          In Eastern Supply Co. v. Westbrook Manufacturing (2019), the court held that supply chain
                          disruptions may constitute force majeure events only if: (1) specifically enumerated in the
                          contract language; (2) truly unforeseeable at the time of contracting; and (3) not preventable
                          through reasonable alternative sourcing strategies. The burden of proof rests with the party
                          invoking the force majeure clause.
                        </p>
                        <p>
                          Evidence indicates that semiconductor shortages were widely reported in the industry beginning
                          in late 2021, several months before contract execution. Johnson's internal documents (Exhibit
                          D-7) suggest awareness of potential supply constraints during the negotiation period, which
                          undermines the unforeseeability element required for force majeure protection.
                        </p>

                        <h4>C. Material Breach and Contract Termination</h4>
                        <p>
                          Section 12.1 of the Contract permits termination by the non-breaching party if: (a) the other
                          party fails to perform any material obligation and does not cure such failure within 30 days
                          of written notice; or (c) the other party delivers non-conforming goods exceeding 15% of any
                          shipment. Smith's termination notice cited both provisions.
                        </p>
                        <p>
                          In determining whether a breach is material, courts in this jurisdiction consider: (1) the
                          extent to which the injured party will be deprived of the benefit reasonably expected; (2) the
                          extent to which the injured party can be adequately compensated; (3) the extent to which the
                          breaching party will suffer forfeiture; (4) the likelihood that the breaching party will cure;
                          and (5) the extent to which the breaching party's behavior comports with standards of good
                          faith and fair dealing.
                        </p>
                        <p>
                          The evidence suggests that Smith's production capabilities were significantly impaired by both
                          delivery delays and quality issues, potentially satisfying the materiality threshold. However,
                          Johnson's documented attempts to resolve the supply issues and its prompt response to quality
                          complaints may be relevant to the good faith consideration.
                        </p>

                        <h3>IV. Evidentiary Assessment</h3>

                        <h4>A. Documentary Evidence</h4>
                        <p>Key documentary evidence includes:</p>
                        <ul>
                          <li>The Contract and all amendments (Exhibits P-1, P-2)</li>
                          <li>Delivery records showing partial shipments July-August 2022 (Exhibit P-3)</li>
                          <li>Quality testing reports from Smith's laboratory (Exhibit P-4)</li>
                          <li>Independent testing results from TechCert Labs (Exhibits P-5, D-3)</li>
                          <li>Email correspondence regarding supply issues (Exhibits P-6, D-2)</li>
                          <li>Johnson's internal supply chain assessment dated February 2022 (Exhibit D-7)</li>
                          <li>Industry reports on semiconductor shortages (Exhibits D-4, D-5)</li>
                        </ul>
                        <p>
                          The documentary evidence presents conflicting narratives regarding the quality issues. Smith's
                          testing reports (Exhibit P-4) indicate failure rates of 38-42% across three shipments, while
                          Johnson's independent testing (Exhibit D-3) shows only 12-15% defect rates. This discrepancy
                          may be attributable to different testing methodologies, as noted in the expert reports.
                        </p>

                        <h4>B. Expert Testimony</h4>
                        <p>Both parties have retained expert witnesses:</p>
                        <ul>
                          <li>
                            Dr. Eleanor Chen (for Smith): Opines that the components failed to meet industry standards
                            for durability and performance under specified conditions.
                          </li>
                          <li>
                            Dr. Marcus Wong (for Johnson): Contends that Smith's testing protocols exceeded contractual
                            requirements and applied standards not specified in Appendix A.
                          </li>
                          <li>
                            James Harrison (for Smith): Calculates damages based on increased procurement costs and lost
                            sales.
                          </li>
                          <li>
                            Dr. Sophia Rodriguez (for Johnson): Challenges Harrison's methodology as speculative and
                            failing to account for market-wide demand fluctuations.
                          </li>
                        </ul>

                        <h3>V. Damages Analysis</h3>
                        <p>
                          If breach is established, Smith may be entitled to damages under UCC § 2-712 (cover damages)
                          and § 2-715 (incidental and consequential damages). Smith claims:
                        </p>
                        <ul>
                          <li>
                            $450,000 in premium procurement costs for emergency sourcing of replacement components
                          </li>
                          <li>$320,000 in production delay costs</li>
                          <li>$430,000 in lost profits from canceled orders</li>
                        </ul>
                        <p>
                          The claim for lost profits requires particular scrutiny under the "reasonable certainty"
                          standard established in Reliable Shipping v. Global Distributors (2018). Smith must
                          demonstrate that such losses were foreseeable at the time of contracting and directly
                          attributable to Johnson's breach rather than market conditions or other factors.
                        </p>

                        <h3>VI. Conclusion and Recommendation</h3>
                        <p>
                          Based on the comprehensive analysis of applicable law, contractual provisions, and available
                          evidence, Smith has established a prima facie case for breach of contract. Johnson's force
                          majeure defense faces significant challenges given the foreseeability of supply chain issues
                          at the time of contracting.
                        </p>
                        <p>
                          The conflicting evidence regarding quality defects presents a factual dispute that may require
                          resolution at trial. If Smith prevails on the quality issue, its termination would likely be
                          deemed valid under Section 12.1(c) of the Contract.
                        </p>
                        <p>
                          Regarding damages, Smith appears entitled to recover its cover costs ($450,000) and production
                          delay expenses ($320,000) if breach is proven. The lost profits claim ($430,000) faces greater
                          evidentiary hurdles and may be subject to reduction based on causation and foreseeability
                          limitations.
                        </p>
                        <p>
                          Settlement discussions are recommended, with a suggested resolution range of
                          $600,000-$800,000, reflecting the strength of Smith's liability case but accounting for
                          uncertainties in the full damages claim.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-navy-600 flex justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400">Analysis powered by LegalMind AI</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="text-xs">
                      <Download className="h-3 w-3 mr-1" />
                      Export as PDF
                    </Button>
                    <Button size="sm" className="bg-gold-500 hover:bg-gold-600 text-navy-900 text-xs">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Share Analysis
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

