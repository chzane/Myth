import React from 'react'
import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import { ReactRenderer } from '@tiptap/react'
import tippy from 'tippy.js'
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Image as ImageIcon,
  Table,
  Minus,
  Sparkles,
  FileCode,
  Globe,
  Layout,
} from 'lucide-react'
import { CommandList } from '../menus/CommandList'

const moveCursorToBlockStart = (editor) => {
  const { $from } = editor.state.selection
  const pos = $from.start($from.depth)
  editor.commands.setTextSelection(pos)
  editor.commands.scrollIntoView()
}

const getSuggestionItems = ({ query, requestInput, requestImage, notify }) => {
  const items = [
    {
      title: 'Ask AI',
      icon: <Sparkles size={18} />,
      section: 'AI',
      command: () => {
        notify({ type: 'info', message: 'AI 功能即将上线' })
      },
    },
    {
      title: 'Heading 1',
      icon: <Heading1 size={18} />,
      section: 'Basic Blocks',
      command: ({ editor, range }) => {
        const success = editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode('heading', { level: 1 })
          .run()
        moveCursorToBlockStart(editor)
        notify({ type: success ? 'success' : 'error', message: success ? '已插入标题 1' : '操作失败' })
      },
    },
    {
      title: 'Heading 2',
      icon: <Heading2 size={18} />,
      section: 'Basic Blocks',
      command: ({ editor, range }) => {
        const success = editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode('heading', { level: 2 })
          .run()
        moveCursorToBlockStart(editor)
        notify({ type: success ? 'success' : 'error', message: success ? '已插入标题 2' : '操作失败' })
      },
    },
    {
      title: 'Heading 3',
      icon: <Heading3 size={18} />,
      section: 'Basic Blocks',
      command: ({ editor, range }) => {
        const success = editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode('heading', { level: 3 })
          .run()
        moveCursorToBlockStart(editor)
        notify({ type: success ? 'success' : 'error', message: success ? '已插入标题 3' : '操作失败' })
      },
    },
    {
      title: 'Bullet List',
      icon: <List size={18} />,
      section: 'Basic Blocks',
      command: ({ editor, range }) => {
        const success = editor.chain().focus().deleteRange(range).toggleBulletList().run()
        moveCursorToBlockStart(editor)
        notify({ type: success ? 'success' : 'error', message: success ? '已插入项目符号列表' : '操作失败' })
      },
    },
    {
      title: 'Numbered List',
      icon: <ListOrdered size={18} />,
      section: 'Basic Blocks',
      command: ({ editor, range }) => {
        const success = editor.chain().focus().deleteRange(range).toggleOrderedList().run()
        moveCursorToBlockStart(editor)
        notify({ type: success ? 'success' : 'error', message: success ? '已插入有序列表' : '操作失败' })
      },
    },
    {
      title: 'To-do List',
      icon: <CheckSquare size={18} />,
      section: 'Basic Blocks',
      command: ({ editor, range }) => {
        const success = editor.chain().focus().deleteRange(range).toggleTaskList().run()
        moveCursorToBlockStart(editor)
        notify({ type: success ? 'success' : 'error', message: success ? '已插入任务列表' : '操作失败' })
      },
    },
    {
      title: 'Quote',
      icon: <Quote size={18} />,
      section: 'Basic Blocks',
      command: ({ editor, range }) => {
        const success = editor.chain().focus().deleteRange(range).setBlockquote().run()
        moveCursorToBlockStart(editor)
        notify({ type: success ? 'success' : 'error', message: success ? '已插入引用' : '操作失败' })
      },
    },
    {
      title: 'Code Block',
      icon: <Code size={18} />,
      section: 'Advanced',
      command: ({ editor, range }) => {
        const success = editor.chain().focus().deleteRange(range).setCodeBlock().run()
        moveCursorToBlockStart(editor)
        notify({ type: success ? 'success' : 'error', message: success ? '已插入代码块' : '操作失败' })
      },
    },
    {
      title: 'Table',
      icon: <Table size={18} />,
      section: 'Advanced',
      command: ({ editor, range }) => {
        const success = editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run()
        moveCursorToBlockStart(editor)
        notify({ type: success ? 'success' : 'error', message: success ? '已插入表格' : '操作失败' })
      },
    },
    {
      title: 'Image',
      icon: <ImageIcon size={18} />,
      section: 'Media',
      command: async ({ editor, range }) => {
        // Delete slash command first to close menu
        editor.chain().focus().deleteRange(range).run()
        
        const imageSrc = await requestImage()
        if (imageSrc) {
          // Convert local path to myth protocol if needed
          const src = imageSrc.startsWith('/') ? `myth://${imageSrc}` : imageSrc
          editor.chain().focus().setImage({ src }).run()
          notify({ type: 'success', message: '图片已插入' })
        }
      },
    },
    {
      title: 'Divider',
      icon: <Minus size={18} />,
      section: 'Basic Blocks',
      command: ({ editor, range }) => {
        const success = editor.chain().focus().deleteRange(range).setHorizontalRule().run()
        moveCursorToBlockStart(editor)
        notify({ type: success ? 'success' : 'error', message: success ? '已插入分割线' : '操作失败' })
      },
    },
    {
      title: 'Embed HTML',
      icon: <FileCode size={18} />,
      section: 'Advanced',
      command: async ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run()
        const html = await requestInput({
          title: '嵌入 HTML',
          placeholder: '<div>...</div>',
          multiline: true,
        })
        if (html) {
          editor.chain().focus().insertContent(html).run()
          notify({ type: 'success', message: 'HTML 已插入' })
        }
      },
    },
    {
      title: 'Embed Webpage',
      icon: <Globe size={18} />,
      section: 'Advanced',
      command: async ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run()
        const url = await requestInput({
          title: '嵌入网页',
          placeholder: 'https://example.com',
        })
        if (url) {
          editor.chain().focus().setIframe({ src: url }).run()
          notify({ type: 'success', message: '网页已嵌入' })
        }
      },
    },
    {
      title: 'Tabs',
      icon: <Layout size={18} />,
      section: 'Advanced',
      command: ({ editor, range }) => {
        // Direct creation without prompt
        editor.chain().focus().deleteRange(range).insertTabs([{ title: '', content: '' }]).run()
        notify({ type: 'success', message: 'Tabs 已创建' })
      },
    },
  ]

  return items.filter((item) => item.title.toLowerCase().startsWith(query.toLowerCase()))
}

const renderItems = () => {
  let component
  let popup

  return {
    onStart: (props) => {
      component = new ReactRenderer(CommandList, {
        props,
        editor: props.editor,
      })

      if (!props.clientRect) {
        return
      }

      popup = tippy('body', {
        getReferenceClientRect: props.clientRect,
        appendTo: () => document.body,
        content: component.element,
        showOnCreate: true,
        interactive: true,
        trigger: 'manual',
        placement: 'bottom-start',
      })
    },
    onUpdate: (props) => {
      component.updateProps(props)

      if (!props.clientRect) {
        return
      }

      popup[0].setProps({
        getReferenceClientRect: props.clientRect,
      })
    },
    onKeyDown: (props) => {
      if (props.event.key === 'Escape') {
        popup[0].hide()
        return true
      }

      return component.ref?.onKeyDown(props)
    },
    onExit: () => {
      popup[0].destroy()
      component.destroy()
    },
  }
}

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      requestInput: async () => null,
      requestImage: async () => null,
      notify: () => {},
      suggestion: {
        char: '/',
        command: ({ editor, range, props }) => {
          props.command({ editor, range })
        },
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        items: (props) =>
          getSuggestionItems({
            ...props,
            requestInput: this.options.requestInput,
            requestImage: this.options.requestImage,
            notify: this.options.notify,
          }),
        render: renderItems,
      }),
    ]
  },
})
