import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api-auth'
import { z } from 'zod'

// Define the URL for the Python service, managed by PM2
// This MUST be 127.0.0.1 (localhost) because the Next.js server
// and the Python server are running on the *same machine*.
const PYTHON_CORE_URL = 'http://127.0.0.1:8008'

// Define the schema for the incoming request from the client
const orchestrateRequestSchema = z.object({
  requests: z.array(
    z.object({
      provider: z.string(),
      model: z.string(),
      prompt: z.string(),
    })
  ),
  prompt: z.string(),
})

/**
 * This API route is the "bridge" to the Python service.
 * It authenticates the user, validates the request,
 * and then proxies the request to the FastAPI backend.
 */
export async function POST(req: Request) {
  // 1. Authenticate the user
  const authCheck = await getAuthenticatedUser()
  if (authCheck instanceof NextResponse) return authCheck
  // const { user } = authCheck // We have the user if we need to log their usage

  let body
  try {
    body = await req.json()
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // 2. Validate the request body
  const validation = orchestrateRequestSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: validation.error.flatten() },
      { status: 400 }
    )
  }

  // 3. Proxy the request to the Python (FastAPI) service
  try {
    const pythonResponse = await fetch(
      `${PYTHON_CORE_URL}/api/v1/llm/orchestrate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(validation.data),
      }
    )

    if (!pythonResponse.ok) {
      const errorData = await pythonResponse.json().catch(() => ({}))
      return NextResponse.json(
        {
          error: 'Python service failed',
          details: errorData.detail || 'No details from service',
        },
        { status: pythonResponse.status }
      )
    }

    const data = await pythonResponse.json()
    return NextResponse.json(data)
    
  } catch (error: any) {
    console.error('Failed to connect to Python service:', error.message)
    return NextResponse.json(
      { error: 'Failed to connect to orchestration service' },
      { status: 503 } // 503 Service Unavailable
    )
  }
}