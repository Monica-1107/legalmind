"use client"

import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";
import ProtectedRoute from "@/components/protected-route";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const { user } = useAuth();

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
                <Link href="/documents">Documents</Link>
                <Link href="/analysis">Analysis</Link>
                <Link href="/chat">Chat</Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Welcome, {user?.name || user?.email}
              </span>
              <Button variant="outline" onClick={() => useAuth().logout()}>
                Logout
              </Button>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center space-y-8 text-center">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              Welcome to Legal Mind
            </h1>
            <p className="max-w-[700px] text-lg text-muted-foreground sm:text-xl">
              Your AI-powered legal analysis and document management system
            </p>
            <div className="flex space-x-4">
              <Button asChild>
                <Link href="/documents">Upload Documents</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/analysis">Start Analysis</Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
} 