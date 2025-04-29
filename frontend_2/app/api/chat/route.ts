import { NextResponse } from 'next/server'
import { chatWithDocument } from '@/lib/api'

// Handle GET requests (optional) to avoid 404
export async function GET(request: Request) {
  return NextResponse.json({ message: 'Chat endpoint ready' })
}

// Handler for POST requests
export async function POST(request: Request) {
  try {
    const body = await request.json()
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
    // Call backend chat endpoint
    const response = await chatWithDocument({
      message: body.message,
      document_id: body.document_id,
      session_id: body.session_id,
      mode: body.mode,
      hypothetical: body.hypothetical
    }, token)
    return NextResponse.json(response)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 