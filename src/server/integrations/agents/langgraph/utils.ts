import { BaseMessage } from '@langchain/core/messages'
// Helper function to safely get message content
export function getMessageContent(message: BaseMessage): string {
  try {
    if (!message.content) return ''

    if (typeof message.content === 'string') {
      return message.content
    }

    // Handle complex message content if needed
    if (Array.isArray(message.content)) {
      return message.content
        .map((content) => {
          if (typeof content === 'string') return content
          if ('text' in content) return content.text
          return ''
        })
        .join(' ')
    }
  } catch (error) {
    console.error('getMessageContent', error)
  }

  return ''
}
