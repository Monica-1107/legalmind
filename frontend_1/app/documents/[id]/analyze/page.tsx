"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Document } from "@/lib/types";
import { Button } from "@/components/ui/button";

export default function AnalyzeDocumentPage() {
  const params = useParams();
  const docId = params?.id as string;
  const [document, setDocument] = useState<Document | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<'standard' | 'hypothetical' | 'hierarchical'>('standard');
  const [level, setLevel] = useState(1);
  const [hypothetical, setHypothetical] = useState("");

  useEffect(() => {
    if (docId) {
      api.getDocument(docId).then(setDocument).catch(() => setError("Failed to load document"));
    }
  }, [docId]);

  const handleAnalyze = async () => {
    setLoading(true);
    setError("");
    setAnalysis(null);
    try {
      if (!document) throw new Error("Document not loaded");
      const options: any = { 
        analysis_mode: mode,
        content: document.content, // <-- add this line
      };
      if (mode === "hierarchical") options.analysis_level = level;
      if (mode === "hypothetical") options.hypothetical_scenario = { scenario: hypothetical };
      console.log(options)
      const result = await api.analyzeDocument(docId, options);
      console.log("result", result);
      setAnalysis(result.analysis || result.analysis_results || result);
    } catch (err: any) {
      setError(err.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">Analyze Document</h1>
      {document && (
        <div className="mb-4 p-4 border rounded bg-muted">
          <div className="font-semibold">{document.title || document.filename}</div>
          <div className="text-sm text-muted-foreground mb-1">Uploaded on {new Date(document.created_at).toLocaleDateString()}</div>
        </div>
      )}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleAnalyze();
        }}
        className="mb-6"
      >
        <div className="mb-4">
          <label className="block font-semibold mb-1">Analysis Mode</label>
          <select
            value={mode}
            onChange={e => setMode(e.target.value as any)}
            className="border rounded px-2 py-1"
          >
            <option value="standard">Standard</option>
            <option value="hierarchical">Hierarchical</option>
            <option value="hypothetical">Hypothetical</option>
          </select>
        </div>
        {mode === "hierarchical" && (
          <div className="mb-4">
            <label className="block font-semibold mb-1">Detail Level (1-3)</label>
            <input
              type="number"
              min={1}
              max={3}
              value={level}
              onChange={e => setLevel(Number(e.target.value))}
              className="border rounded px-2 py-1 w-20"
            />
          </div>
        )}
        {mode === "hypothetical" && (
          <div className="mb-4">
            <label className="block font-semibold mb-1">Hypothetical Scenario</label>
            <input
              type="text"
              value={hypothetical}
              onChange={e => setHypothetical(e.target.value)}
              className="border rounded px-2 py-1 w-full"
              placeholder="Describe a scenario..."
            />
          </div>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? "Analyzing..." : "Run Analysis"}
        </Button>
      </form>
      {error && <div className="mb-4 text-red-600">{error}</div>}
      {analysis && (
        <div className="border rounded p-4 bg-card">
          <h2 className="font-semibold mb-2">Analysis Results</h2>
          {analysis.summary && <div className="mb-2"><b>Summary:</b> {analysis.summary}</div>}
          {analysis.key_points && (
            <div className="mb-2">
              <b>Key Points:</b>
              <ul className="list-disc ml-6">
                {analysis.key_points.map((pt: string, idx: number) => (
                  <li key={idx}>{pt}</li>
                ))}
              </ul>
            </div>
          )}
          {analysis.recommendations && (
            <div className="mb-2">
              <b>Recommendations:</b>
              <ul className="list-disc ml-6">
                {analysis.recommendations.map((rec: string, idx: number) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
          {/* Fallback for other analysis content */}
          {(!analysis.summary && !analysis.key_points && !analysis.recommendations) && (
            <pre className="bg-muted p-2 rounded text-sm overflow-x-auto">{JSON.stringify(analysis, null, 2)}</pre>
          )}
        </div>
      )}
    </div>
  );
}
