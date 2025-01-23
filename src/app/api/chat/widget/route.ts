// src/app/api/chat/widget/route.ts
import { NextResponse } from 'next/server'
import { widgetScript } from '~/app/api/chat/widget/widget'

export async function GET(request: Request) {
  // Get the workspace ID from URL search params
  const { searchParams } = new URL(request.url)
  const workspaceId = searchParams.get('workspaceId')

  // The JavaScript code that will be served

  // Create response with proper headers
  return new NextResponse(widgetScript, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600'
    }
  })
}
