import * as React from 'react'
import type { Editor } from '@tiptap/react'
import type { FormatAction } from '../../types'
import type { toggleVariants } from '~/components/ui/toggle'
import type { VariantProps } from 'class-variance-authority'
import {
  CaretDownIcon,
  CodeIcon,
  DividerHorizontalIcon,
  PlusIcon,
  QuoteIcon
} from '@radix-ui/react-icons'
import { LinkEditPopover } from '../link/link-edit-popover'
import { ImageEditDialog } from '../image/image-edit-dialog'
import { ToolbarSection } from '../toolbar-section'
import { Sparkle } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { useEmailMessageStore } from '~/app/_components/mail/useEmailMessageStore'
import { useThreadStore } from '~/hooks/store/useThread'
import { api } from '~/trpc/react'
import { useWorkspace } from '~/hooks/context/useWorkspaces'

type InsertElementAction = 'codeBlock' | 'blockquote' | 'horizontalRule'
interface InsertElement extends FormatAction {
  value: InsertElementAction
}

const formatActions: InsertElement[] = [
  {
    value: 'codeBlock',
    label: 'Code block',
    icon: <CodeIcon className="size-5" />,
    action: (editor) => editor.chain().focus().toggleCodeBlock().run(),
    isActive: (editor) => editor.isActive('codeBlock'),
    canExecute: (editor) => editor.can().chain().focus().toggleCodeBlock().run(),
    shortcuts: ['mod', 'alt', 'C']
  },
  {
    value: 'blockquote',
    label: 'Blockquote',
    icon: <QuoteIcon className="size-5" />,
    action: (editor) => editor.chain().focus().toggleBlockquote().run(),
    isActive: (editor) => editor.isActive('blockquote'),
    canExecute: (editor) => editor.can().chain().focus().toggleBlockquote().run(),
    shortcuts: ['mod', 'shift', 'B']
  },
  {
    value: 'horizontalRule',
    label: 'Divider',
    icon: <DividerHorizontalIcon className="size-5" />,
    action: (editor) => editor.chain().focus().setHorizontalRule().run(),
    isActive: () => false,
    canExecute: (editor) => editor.can().chain().focus().setHorizontalRule().run(),
    shortcuts: ['mod', 'alt', '-']
  }
]

interface SectionFiveProps extends VariantProps<typeof toggleVariants> {
  editor: Editor
  activeActions?: InsertElementAction[]
  mainActionCount?: number
}

export const SectionFive: React.FC<SectionFiveProps> = ({
  editor,
  activeActions = formatActions.map((action) => action.value),
  mainActionCount = 0,
  size,
  variant
}) => {
  const { selectedWorkspaceId } = useWorkspace()
  const { emailMessageContent, setEmailMessageContent } = useEmailMessageStore()
  const { selectedThreadId } = useThreadStore()

  const generateEmailReply = api.messages.generateEmailMessageReply.useMutation({
    onSuccess: (data) => {
      console.log('data.text', data.text)

      if (data.text) {
        setEmailMessageContent(data.text)
      }
    }
  })
  return (
    <>
      <LinkEditPopover editor={editor} size={size} variant={variant} />
      <ImageEditDialog editor={editor} size={size} variant={variant} />
      <ToolbarSection
        editor={editor}
        actions={formatActions}
        activeActions={activeActions}
        mainActionCount={mainActionCount}
        dropdownIcon={
          <>
            <PlusIcon className="size-5" />
            <CaretDownIcon className="size-5" />
          </>
        }
        dropdownTooltip="Insert elements"
        size={size}
        variant={variant}
      />
      <Button
        onClick={(e) => {
          e.preventDefault()
          generateEmailReply.mutate({
            workspaceId: selectedWorkspaceId,
            threadId: selectedThreadId
          })
        }}
        variant="ghost"
        size="icon"
        className="ml-auto"
      >
        {generateEmailReply.isPending ? (
          <span className="loading loading-spinner loading-sm"></span>
        ) : (
          <Sparkle className="size-5" />
        )}
      </Button>
    </>
  )
}

SectionFive.displayName = 'SectionFive'

export default SectionFive
