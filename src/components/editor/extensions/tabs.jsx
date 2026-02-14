import React, { useMemo, useState, useEffect, useRef } from 'react'
import { Node } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import { X, Plus } from 'lucide-react'

const TabsView = ({ node, updateAttributes }) => {
  const tabs = useMemo(() => node.attrs.tabs || [], [node.attrs.tabs])
  const activeIndex = node.attrs.active || 0
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const [isHeaderHovered, setIsHeaderHovered] = useState(false)
  const safeIndex = Math.min(activeIndex, Math.max(tabs.length - 1, 0))
  const textareaRef = useRef(null)

  const activeTab = tabs[safeIndex] || tabs[0]

  useEffect(() => {
    if (tabs.length === 0) {
      updateAttributes({ tabs: [{ title: '', content: '' }], active: 0 })
    }
  }, [tabs.length, updateAttributes])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [activeTab?.content, safeIndex])

  const handleSelect = (index) => {
    updateAttributes({ active: index })
  }

  const handleTitleChange = (index, value) => {
    const nextTabs = tabs.map((tab, tabIndex) =>
      tabIndex === index ? { ...tab, title: value } : tab
    )
    updateAttributes({ tabs: nextTabs })
  }

  const handleContentChange = (index, value) => {
    const nextTabs = tabs.map((tab, tabIndex) =>
      tabIndex === index ? { ...tab, content: value } : tab
    )
    updateAttributes({ tabs: nextTabs })
  }

  const handleAddTab = () => {
    const nextTabs = [...tabs, { title: '', content: '' }]
    const nextIndex = nextTabs.length - 1
    updateAttributes({ tabs: nextTabs, active: nextIndex })
  }

  const handleDeleteTab = (e, index) => {
    e.stopPropagation()
    const nextTabs = tabs.filter((_, i) => i !== index)
    if (nextTabs.length === 0) {
      return
    }
    const nextIndex = index <= activeIndex ? Math.max(0, activeIndex - 1) : activeIndex
    updateAttributes({ tabs: nextTabs, active: nextIndex })
  }

  return (
    <NodeViewWrapper className="tabs-node" contentEditable={false}>
      <div 
        className="flex flex-wrap items-center gap-2 mb-2 relative"
        onMouseEnter={() => setIsHeaderHovered(true)}
        onMouseLeave={() => setIsHeaderHovered(false)}
      >
        {tabs.map((tab, index) => (
          <div
            key={`${index}`}
            className={`
              relative group flex items-center px-3 py-1 rounded-full cursor-pointer transition-all border
              ${index === safeIndex 
                ? 'bg-black text-white border-black shadow-md' 
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }
            `}
            onClick={() => handleSelect(index)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <input
              className={`
                bg-transparent border-none outline-none text-sm font-medium w-20 text-center
                ${index === safeIndex ? 'text-white placeholder-gray-400' : 'text-gray-600 placeholder-gray-400'}
              `}
              value={tab.title}
              onChange={(event) => handleTitleChange(index, event.target.value)}
              placeholder="Tab Name"
            />
            {(hoveredIndex === index || index === safeIndex) && tabs.length > 1 && (
              <button
                className={`
                  ml-1 p-0.5 rounded-full hover:bg-white/20 transition-colors
                  ${index === safeIndex ? 'text-white' : 'text-gray-500'}
                `}
                onClick={(e) => handleDeleteTab(e, index)}
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}
        
        {isHeaderHovered && (
          <button
            className="flex items-center justify-center w-6 h-6 rounded-full bg-white border border-gray-200 hover:border-purple-500 hover:text-purple-600 text-gray-400 transition-colors shadow-sm"
            onClick={handleAddTab}
            title="Add Tab"
          >
            <Plus size={14} />
          </button>
        )}
      </div>
      
      <div className="tabs-content border border-gray-300 rounded-md p-3 bg-white">
        <textarea
          ref={textareaRef}
          className="w-full resize-none outline-none border-none bg-transparent text-gray-800 leading-relaxed placeholder-gray-400 p-0"
          value={activeTab?.content || ''}
          onChange={(event) => handleContentChange(safeIndex, event.target.value)}
          placeholder="Start typing..."
          rows={1}
        />
      </div>
    </NodeViewWrapper>
  )
}

export const Tabs = Node.create({
  name: 'tabs',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      tabs: {
        default: [{ title: '', content: '' }],
      },
      active: {
        default: 0,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="tabs"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { ...HTMLAttributes, 'data-type': 'tabs' }]
  },

  addNodeView() {
    return ReactNodeViewRenderer(TabsView, {
      stopEvent: () => true,
    })
  },

  addCommands() {
    return {
      insertTabs:
        (tabs) =>
        ({ commands }) => {
          const safeTabs = tabs?.length ? tabs : [{ title: '', content: '' }]
          return commands.insertContent({
            type: this.name,
            attrs: { tabs: safeTabs, active: 0 },
          })
        },
    }
  },
})
