import React from 'react'
import { BubbleMenu } from '@tiptap/react/menus'
import { Bold, Italic, Underline, Strikethrough, Code, Sparkles } from 'lucide-react'
import clsx from 'clsx'

export const EditorBubbleMenu = ({ editor }) => {
  if (!editor) {
    return null
  }

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 100 }}
      className="flex overflow-hidden rounded border border-stone-200 bg-white shadow-xl"
    >
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={clsx(
          'p-2 hover:bg-stone-100 text-stone-600 hover:text-stone-900',
          editor.isActive('bold') && 'bg-stone-100 text-stone-900'
        )}
      >
        <Bold size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={clsx(
          'p-2 hover:bg-stone-100 text-stone-600 hover:text-stone-900',
          editor.isActive('italic') && 'bg-stone-100 text-stone-900'
        )}
      >
        <Italic size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={clsx(
          'p-2 hover:bg-stone-100 text-stone-600 hover:text-stone-900',
          editor.isActive('underline') && 'bg-stone-100 text-stone-900'
        )}
      >
        <Underline size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={clsx(
          'p-2 hover:bg-stone-100 text-stone-600 hover:text-stone-900',
          editor.isActive('strike') && 'bg-stone-100 text-stone-900'
        )}
      >
        <Strikethrough size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={clsx(
          'p-2 hover:bg-stone-100 text-stone-600 hover:text-stone-900',
          editor.isActive('code') && 'bg-stone-100 text-stone-900'
        )}
      >
        <Code size={16} />
      </button>
      <div className="w-px bg-stone-200 mx-1 my-2" />
      <button
        onClick={() => {
            const selection = editor.state.selection
            const text = editor.state.doc.textBetween(selection.from, selection.to, ' ')
            alert(`AI Assistant called with text: "${text}"`)
        }}
        className="flex items-center gap-1 p-2 hover:bg-purple-100 text-purple-600 hover:text-purple-900 font-medium text-xs"
      >
        <Sparkles size={14} />
        Ask AI
      </button>
    </BubbleMenu>
  )
}
