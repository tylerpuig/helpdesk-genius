import { NextResponse } from 'next/server'
import { getWidgetScript } from '../../../../server/widget/widget'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  // Get workspaceId from URL
  const { searchParams } = new URL(request.url)
  const workspaceId = searchParams.get('workspaceId')

  // Create response with JavaScript content type
  const widgetScript = getWidgetScript(workspaceId as string)
  const response = new NextResponse(widgetScript, {
    headers: {
      'Content-Type': 'application/javascript',
      'Access-Control-Allow-Origin': '*', // Or specify domain
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })

  return response
}
