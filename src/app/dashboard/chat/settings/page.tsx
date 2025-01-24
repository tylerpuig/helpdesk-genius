import { ChatbotConfig } from '~/app/_components/chat/settings/chat-bot-config'
import { ScriptTagCopy } from '~/app/_components/chat/settings/chat-bot-script'

export default function ChatSettings() {
  return (
    <div className="container mx-auto space-y-10 px-6 py-10">
      <h1 className="mb-8 text-3xl font-bold">Chatbot Configuration</h1>
      <div>
        <h2 className="mb-4 text-2xl font-semibold">Settings</h2>
        <ChatbotConfig />
      </div>
      <div>
        <h2 className="mb-4 text-2xl font-semibold">Installation</h2>
        <ScriptTagCopy />
      </div>
    </div>
  )
}
