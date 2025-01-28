import { create } from 'zustand'

type EmailMessageStore = {
  emailMessageContent: string
  setEmailMessageContent: (content: string) => void
}
export const useEmailMessageStore = create<EmailMessageStore>((set) => ({
  emailMessageContent: '',
  setEmailMessageContent: (content: string) => set({ emailMessageContent: content })
}))
