import { NextRequest, NextResponse } from 'next/server'
import * as dbInsertionUtils from '~/server/db/utils/insertions'
import * as dbQueryUtils from '~/server/db/utils/queries'
import { chatEE, type EventEmitterChatMessage } from '~/server/api/routers/chat'

export const runtime = 'nodejs'

type ChatRequest = {
  workspaceId: string
  message: string
  chatId: string
  user: {
    name: string
    email: string
  }
}

type ChatResponse = {
  response: string
  timestamp: number
  threadId: string
}

const chatCache = new Map<string, string>()

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ChatRequest
    const { workspaceId, message, chatId, user } = body

    if (!workspaceId || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let threadId = chatCache.get(chatId)

    if (!threadId) {
      const newChat = await dbInsertionUtils.createNewChat(workspaceId, message)
      const subMessage: EventEmitterChatMessage = {
        notificationType: 'NEW_THREAD'
      }
      chatEE.emit('newMessage', subMessage)
      if (!newChat) {
        return NextResponse.json({ error: 'Failed to create new chat' }, { status: 500 })
      }
      threadId = newChat.id
      chatCache.set(chatId, threadId)
    }

    await dbInsertionUtils.createNewChatMessage(threadId, message, user)

    const response: ChatResponse = {
      response: `Received message: ${message}`,
      timestamp: Date.now(),
      threadId
    }

    const subMessage: EventEmitterChatMessage = {
      notificationType: 'NEW_MESSAGE'
    }
    chatEE.emit('newMessage', subMessage)

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error processing chat message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

type ChatMessagesRequest = {
  workspaceId: string
  chatId: string
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const workspaceId = searchParams.get('workspaceId')
    const chatId = searchParams.get('chatId')

    if (!workspaceId || !chatId) {
      return NextResponse.json({ error: 'Missing workspaceId or chatId' }, { status: 400 })
    }

    const params: ChatMessagesRequest = {
      workspaceId,
      chatId
    }

    let threadId = chatCache.get(params.chatId)
    if (!threadId) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    const messages = await dbQueryUtils.getChatMessages(threadId)

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error processing chat message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
