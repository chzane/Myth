import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Underline from '@tiptap/extension-underline'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { all, createLowlight } from 'lowlight'
import { Plus } from 'lucide-react'
import './styles.css'
import { EditorBubbleMenu } from './menus/EditorBubbleMenu'
import { SlashCommand } from './extensions/slash-command.jsx'
import { Iframe } from './extensions/iframe.jsx'
import { Tabs } from './extensions/tabs.jsx'
import { CodeBlockView } from './extensions/CodeBlockView'
import { CustomTable } from './extensions/CustomTable'

const lowlight = createLowlight(all)

// Toast feedback
const Toast = ({ toast }) => {
  if (!toast) return null
  return (
    <div className={`editor-toast ${toast.type}`}>
      {toast.message}
    </div>
  )
}

// Custom input dialog
const InputDialog = ({ open, title, placeholder, value, multiline, onChange, onCancel, onConfirm }) => {
  if (!open) return null
  return (
    <div className="dialog-backdrop">
      <div className="dialog-card">
        <div className="dialog-title">{title}</div>
        {multiline ? (
          <textarea
            className="dialog-input"
            value={value}
            placeholder={placeholder}
            onChange={(event) => onChange(event.target.value)}
          />
        ) : (
          <input
            className="dialog-input"
            value={value}
            placeholder={placeholder}
            onChange={(event) => onChange(event.target.value)}
          />
        )}
        <div className="dialog-actions">
          <button type="button" className="dialog-button ghost" onClick={onCancel}>
            取消
          </button>
          <button type="button" className="dialog-button primary" onClick={onConfirm}>
            确认
          </button>
        </div>
      </div>
    </div>
  )
}

// Image preview dialog
const ImageDialog = ({
  open,
  previewUrl,
  error,
  allowFilePick,
  onFileChange,
  onCancel,
  onConfirm,
}) => {
  if (!open) return null
  return (
    <div className="dialog-backdrop">
      <div className="dialog-card image-dialog">
        <div className="dialog-title">插入图片</div>
        {allowFilePick && (
          <input type="file" accept="image/*" onChange={onFileChange} />
        )}
        <div className="image-preview">
          {previewUrl ? <img src={previewUrl} alt="Preview" /> : <span>请选择图片</span>}
        </div>
        {error && <div className="dialog-error">{error}</div>}
        <div className="dialog-actions">
          <button type="button" className="dialog-button ghost" onClick={onCancel}>
            取消
          </button>
          <button type="button" className="dialog-button primary" onClick={onConfirm}>
            插入
          </button>
        </div>
      </div>
    </div>
  )
}

// Table add-row/add-column controls
const TableControls = ({ tableUI, onAddRow, onAddColumn }) => {
  if (!tableUI) return null
  return (
    <div className="table-controls">
      <button
        type="button"
        className="table-control-button col-add"
        style={{
          left: tableUI.tableRight + 10,
          top: tableUI.tableTop + tableUI.tableHeight / 2 - 20, // Center vertically (40px height / 2)
        }}
        onClick={onAddColumn}
      >
        <Plus size={16} />
        <span>Add Column</span>
      </button>
      <button
        type="button"
        className="table-control-button row-add"
        style={{
          top: tableUI.tableBottom + 10,
          left: tableUI.tableLeft + tableUI.tableWidth / 2 - 50, // Center horizontally (approx width / 2)
        }}
        onClick={onAddRow}
      >
        <Plus size={16} />
        <span>Add Row</span>
      </button>
    </div>
  )
}

// Table context menu
const TableContextMenu = React.forwardRef(({ menu, onAction, onClose }, ref) => {
  if (!menu) return null
  return (
    <div
      ref={ref}
      className="table-context-menu"
      style={{ top: menu.y, left: menu.x }}
    >
      <button type="button" onClick={() => onAction('addRowAfter')}>
        在下方插入行
      </button>
      <button type="button" onClick={() => onAction('addColumnAfter')}>
        在右侧插入列
      </button>
      <button type="button" onClick={() => onAction('deleteRow')}>
        删除行
      </button>
      <button type="button" onClick={() => onAction('deleteColumn')}>
        删除列
      </button>
      <button type="button" onClick={onClose}>
        关闭
      </button>
    </div>
  )
})

TableContextMenu.displayName = 'TableContextMenu'

export const Editor = ({ onUpdate, onCreate }) => {
  const editorContainerRef = useRef(null)
  const contextMenuRef = useRef(null)
  const [toast, setToast] = useState(null)
  const [toastTimer, setToastTimer] = useState(null)
  const [inputResolver, setInputResolver] = useState(null)
  const [imageResolver, setImageResolver] = useState(null)
  const [inputDialog, setInputDialog] = useState({
    open: false,
    title: '',
    placeholder: '',
    value: '',
    multiline: false,
  })
  const [imageDialog, setImageDialog] = useState({
    open: false,
    previewUrl: '',
    error: '',
    allowFilePick: false,
  })
  const [tableUI, setTableUI] = useState(null)
  const [contextMenu, setContextMenu] = useState(null)

  const ipcRenderer = useMemo(() => {
    if (typeof window === 'undefined' || !window.require) {
      return null
    }
    try {
      return window.require('electron').ipcRenderer
    } catch {
      return null
    }
  }, [])

  const notify = useCallback(({ type = 'info', message }) => {
    setToast({ type, message })
    if (toastTimer) {
      clearTimeout(toastTimer)
    }
    const nextTimer = setTimeout(() => setToast(null), 2000)
    setToastTimer(nextTimer)
  }, [toastTimer])

  const requestInput = useCallback(({ title, placeholder, multiline = false, defaultValue = '' }) => {
    return new Promise((resolve) => {
      setInputResolver(() => resolve)
      setInputDialog({
        open: true,
        title,
        placeholder,
        value: defaultValue,
        multiline,
      })
    })
  }, [])

  const handleInputConfirm = useCallback(() => {
    const resolvedValue = inputDialog.multiline
      ? inputDialog.value
      : inputDialog.value.trim()
    setInputDialog((prev) => ({ ...prev, open: false }))
    if (inputResolver) {
      inputResolver(resolvedValue || null)
      setInputResolver(null)
    }
  }, [inputDialog, inputResolver])

  const handleInputCancel = useCallback(() => {
    setInputDialog((prev) => ({ ...prev, open: false }))
    if (inputResolver) {
      inputResolver(null)
      setInputResolver(null)
    }
  }, [inputResolver])

  const validateImagePath = useCallback((value) => {
    const allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
    const extension = value.split('.').pop()?.toLowerCase()
    if (!extension || !allowed.includes(extension)) {
      return { ok: false, message: '请选择 JPG/PNG/GIF/WEBP/SVG 格式的图片' }
    }
    return { ok: true }
  }, [])

  const requestImage = useCallback(async () => {
    if (ipcRenderer) {
      const filePath = await ipcRenderer.invoke('dialog:openFile', {
        filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'] }],
      })
      if (!filePath) {
        return null
      }
      const validation = validateImagePath(filePath)
      if (!validation.ok) {
        notify({ type: 'error', message: validation.message })
        return null
      }
      return new Promise((resolve) => {
        setImageResolver(() => resolve)
        const normalizePath = (p) => {
          if (p.startsWith('file://')) return p.replace('file://', 'myth://')
          if (p.startsWith('/')) return `myth://${p}`
          return p
        }
        setImageDialog({
          open: true,
          previewUrl: normalizePath(filePath),
          error: '',
          allowFilePick: false,
        })
      })
    }
    return new Promise((resolve) => {
      setImageResolver(() => resolve)
      setImageDialog({
        open: true,
        previewUrl: '',
        error: '',
        allowFilePick: true,
      })
    })
  }, [ipcRenderer, notify, validateImagePath])

  const handleImageConfirm = useCallback(() => {
    if (!imageDialog.previewUrl) {
      setImageDialog((prev) => ({ ...prev, error: '请先选择图片' }))
      return
    }
    setImageDialog((prev) => ({ ...prev, open: false }))
    if (imageResolver) {
      imageResolver(imageDialog.previewUrl)
      setImageResolver(null)
    }
  }, [imageDialog.previewUrl, imageResolver])

  const handleImageCancel = useCallback(() => {
    setImageDialog((prev) => ({ ...prev, open: false }))
    if (imageResolver) {
      imageResolver(null)
      setImageResolver(null)
    }
  }, [imageResolver])

  const handleImageFileChange = useCallback(
    (event) => {
      const file = event.target.files?.[0]
      if (!file) return
      const validation = validateImagePath(file.name)
      if (!validation.ok) {
        setImageDialog((prev) => ({ ...prev, error: validation.message }))
        return
      }
      const reader = new FileReader()
      reader.onload = (loadEvent) => {
        setImageDialog((prev) => ({
          ...prev,
          previewUrl: loadEvent.target.result,
          error: '',
        }))
      }
      reader.readAsDataURL(file)
    },
    [validateImagePath]
  )

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder: 'Type "/" for commands...',
      }),
      Image,
      Link.configure({
        openOnClick: false,
      }),
      CustomTable.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Underline,
      CodeBlockLowlight.extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlockView)
        },
      }).configure({
        lowlight,
      }),
      Iframe,
      Tabs,
      SlashCommand.configure({
        requestInput,
        requestImage,
        notify,
      }),
    ],
    [notify, requestImage, requestInput]
  )

  const editor = useEditor({
    extensions,
    content: '<p>Hello World! Try typing <code>/</code> to see the menu.</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON()
      const html = editor.getHTML()
      localStorage.setItem('editor-content', JSON.stringify(json))
      if (onUpdate) {
        onUpdate({ json, html })
      }
    },
    onCreate: ({ editor }) => {
      if (onCreate) {
        onCreate(editor)
      }
    },
  })

  const updateTableUI = useCallback(() => {
    if (!editor || !editorContainerRef.current) {
      setTableUI(null)
      return
    }
    const { from } = editor.state.selection
    const domAtPos = editor.view.domAtPos(from)
    const domNode = domAtPos.node.nodeType === 1 ? domAtPos.node : domAtPos.node.parentElement
    const table = domNode?.closest('table')
    
    if (!table) {
      setTableUI(null)
      return
    }
    
    const containerRect = editorContainerRef.current.getBoundingClientRect()
    const tableRect = table.getBoundingClientRect()
    
    setTableUI({
      tableTop: tableRect.top - containerRect.top,
      tableLeft: tableRect.left - containerRect.left,
      tableRight: tableRect.right - containerRect.left,
      tableBottom: tableRect.bottom - containerRect.top,
      tableHeight: tableRect.height,
      tableWidth: tableRect.width,
    })
  }, [editor])

  const handleAddRow = useCallback(() => {
    if (!editor) return
    editor.chain().focus().addRowAfter().run()
    notify({ type: 'success', message: '已插入行' })
  }, [editor, notify])

  const handleAddColumn = useCallback(() => {
    if (!editor) return
    editor.chain().focus().addColumnAfter().run()
    notify({ type: 'success', message: '已插入列' })
  }, [editor, notify])

  const handleContextMenu = useCallback(
    (event) => {
      const cell = event.target.closest?.('td, th')
      if (!cell || !editor) return
      event.preventDefault()
      const pos = editor.view.posAtDOM(cell, 0)
      editor.commands.setTextSelection(pos)
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        cell,
      })
    },
    [editor]
  )

  const handleContextAction = useCallback(
    (action) => {
      if (!contextMenu?.cell || !editor) return
      const pos = editor.view.posAtDOM(contextMenu.cell, 0)
      editor.commands.setTextSelection(pos)
      const command = editor.commands[action]
      const success = command ? command() : false
      notify({
        type: success ? 'success' : 'error',
        message: success ? '操作成功' : '操作失败',
      })
      setContextMenu(null)
    },
    [contextMenu, editor, notify]
  )

  useEffect(() => {
    if (!editor) return
    const savedContent = localStorage.getItem('editor-content')
    if (savedContent) {
      try {
        editor.commands.setContent(JSON.parse(savedContent))
      } catch {
        // Use a timeout to avoid setState in effect warning if notify triggers state
        setTimeout(() => notify({ type: 'error', message: '内容加载失败' }), 0)
      }
    }
  }, [editor, notify])

  useEffect(() => {
    if (!editor) return
    requestAnimationFrame(updateTableUI)
    editor.on('selectionUpdate', updateTableUI)
    editor.on('transaction', updateTableUI)
    window.addEventListener('resize', updateTableUI)
    const container = editorContainerRef.current
    container?.addEventListener('scroll', updateTableUI)
    return () => {
      editor.off('selectionUpdate', updateTableUI)
      editor.off('transaction', updateTableUI)
      window.removeEventListener('resize', updateTableUI)
      container?.removeEventListener('scroll', updateTableUI)
    }
  }, [editor, updateTableUI])

  useEffect(() => {
    const handleClick = (event) => {
      if (!contextMenuRef.current || contextMenuRef.current.contains(event.target)) {
        return
      }
      setContextMenu(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (!editor) {
    return null
  }

  return (
    <div className="editor-container max-w-4xl mx-auto py-8 px-4" ref={editorContainerRef}>
      {editor && <EditorBubbleMenu editor={editor} />}
      <div className="editor-toolbar">
        <button
          type="button"
          onClick={() => editor.commands.undo()}
          disabled={!editor.can().undo()}
        >
          撤销
        </button>
        <button
          type="button"
          onClick={() => editor.commands.redo()}
          disabled={!editor.can().redo()}
        >
          重做
        </button>
      </div>
      <EditorContent editor={editor} onContextMenu={handleContextMenu} />
      
      <TableControls
        tableUI={tableUI}
        onAddRow={handleAddRow}
        onAddColumn={handleAddColumn}
      />

      <TableContextMenu
        ref={contextMenuRef}
        menu={contextMenu}
        onAction={handleContextAction}
        onClose={() => setContextMenu(null)}
      />

      <InputDialog
        open={inputDialog.open}
        title={inputDialog.title}
        placeholder={inputDialog.placeholder}
        value={inputDialog.value}
        multiline={inputDialog.multiline}
        onChange={(val) => setInputDialog((prev) => ({ ...prev, value: val }))}
        onCancel={handleInputCancel}
        onConfirm={handleInputConfirm}
      />

      <ImageDialog
        open={imageDialog.open}
        previewUrl={imageDialog.previewUrl}
        error={imageDialog.error}
        allowFilePick={imageDialog.allowFilePick}
        onFileChange={handleImageFileChange}
        onCancel={handleImageCancel}
        onConfirm={handleImageConfirm}
      />

      <Toast toast={toast} />
    </div>
  )
}
