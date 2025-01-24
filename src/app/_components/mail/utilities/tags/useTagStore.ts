import { create } from 'zustand'
import { type WorkspaceTag } from '~/server/db/types'

type TagStore = {
  tags: WorkspaceTag[]
  addTag: (tag: WorkspaceTag) => void
  removeTag: (tag: WorkspaceTag) => void
  tagManagerSheetOpen: boolean
  setTagManagerSheetOpen: (open: boolean) => void
}

export const useTagStore = create<TagStore>((set) => ({
  tags: [],
  addTag: (tag: WorkspaceTag) => {
    set((state) => ({
      tags: [...state.tags, tag]
    }))
  },
  removeTag: (tag: WorkspaceTag) => {
    set((state) => ({
      tags: state.tags.filter((item) => item.id !== tag.id)
    }))
  },
  tagManagerSheetOpen: false,
  setTagManagerSheetOpen: (open: boolean) => {
    set(() => ({
      tagManagerSheetOpen: open
    }))
  }
}))
