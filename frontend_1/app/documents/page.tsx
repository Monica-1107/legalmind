"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Document } from "@/lib/types";
import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/protected-route";
import Link from "next/link";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const docs = await api.getDocuments();
      setDocuments(docs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      await api.uploadDocument(file);
      await loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload document");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container flex h-16 items-center justify-between px-4">
            <div className="flex items-center space-x-6">
              <Link href="/" className="flex items-center space-x-2">
                <span className="font-bold">Legal Mind</span>
              </Link>
              <nav className="hidden items-center space-x-6 text-sm font-medium md:flex">
                <Link href="/documents" className="text-primary">Documents</Link>
                <Link href="/analysis">Analysis</Link>
                <Link href="/chat">Chat</Link>
              </nav>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold">Documents</h1>
            <div>
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
              />
              <Button asChild>
                <label htmlFor="file-upload" className="cursor-pointer">
                  Upload Document
                </label>
              </Button>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
            </div>
          ) : documents.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              No documents found. Upload one to get started.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {documents.map((doc) => (
                <div
                  key={doc._id}
                  className="rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <h3 className="mb-2 font-semibold">{doc.title}</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Uploaded on {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <Link href={`/documents/${doc._id}`}>
                        View Details
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <Link href={`/documents/${doc._id}/analyze`}>
                        Analyze
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
} 