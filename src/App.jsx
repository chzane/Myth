import React, { useState } from 'react'
import { Editor } from './components/editor/Editor'
import { Sparkles, LayoutList } from 'lucide-react'
import { ErrorBoundary } from './components/common/ErrorBoundary'

function App() {
  const [headings, setHeadings] = useState([])

  const handleEditorUpdate = ({ json }) => {
    // Extract headings for TOC
    const newHeadings = []
    if (json.content) {
      json.content.forEach((node) => {
        if (node.type === 'heading') {
          newHeadings.push({
            id: `heading-${Math.random().toString(36).substr(2, 9)}`, // Ideally use persistent IDs
            text: node.content ? node.content[0].text : '',
            level: node.attrs.level,
          })
        }
      })
    }
    setHeadings(newHeadings)
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col">
        {/* Header
        <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/80 backdrop-blur-md px-6 py-3 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-stone-900 text-white p-1.5 rounded-md">
              <GripVertical size={20} />
            </div>
            <h1 className="font-bold text-xl tracking-tight">Myth Editor</h1>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-md transition-colors">
              <FileUp size={16} />
              <span>Import</span>
              <input type="file" accept=".json,.html" className="hidden" onChange={importFile} />
            </label>
            <div className="h-6 w-px bg-stone-200"></div>
            <button
              onClick={exportJSON}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-md transition-colors"
            >
              <FileDown size={16} />
              <span>JSON</span>
            </button>
            <button
              onClick={exportHTML}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-md transition-colors"
            >
              <FileDown size={16} />
              <span>HTML</span>
            </button>
          </div>
        </header>
        */}

        <div className="flex flex-1 max-w-7xl mx-auto w-full gap-8 px-6 py-8">
          {/* Main Editor Area */}
          <main className="flex-1 bg-white rounded-xl shadow-sm border border-stone-200 min-h-[600px] relative">
            <Editor onUpdate={handleEditorUpdate} />
          </main>

          {/* Sidebar: Table of Contents */}
          <aside className="w-64 hidden lg:block sticky top-24 h-fit">
            <div className="mb-4 flex items-center gap-2 text-stone-500 font-medium text-sm uppercase tracking-wider">
              <LayoutList size={16} />
              Table of Contents
            </div>
            {headings.length === 0 ? (
              <p className="text-sm text-stone-400 italic">Start writing headings to see them here...</p>
            ) : (
              <nav className="flex flex-col gap-1 border-l border-stone-200 pl-4">
                {headings.map((heading, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      // Scroll to heading implementation would require persistent IDs on nodes
                      alert(`Jump to: ${heading.text}`)
                    }}
                    className={`text-left text-sm py-1 hover:text-stone-900 transition-colors ${
                      heading.level === 1
                        ? 'font-semibold text-stone-800'
                        : heading.level === 2
                        ? 'pl-2 text-stone-600'
                        : 'pl-4 text-stone-500'
                    }`}
                  >
                    {heading.text || 'Untitled'}
                  </button>
                ))}
              </nav>
            )}

            <div className="mt-8 p-4 bg-purple-50 rounded-lg border border-purple-100">
              <div className="flex items-center gap-2 text-purple-700 font-semibold mb-2">
                <Sparkles size={18} />
                <span>AI Assistant</span>
              </div>
              <p className="text-xs text-purple-600 mb-3">
                Select any text and click "Ask AI" in the bubble menu to enhance your writing.
              </p>
              <button className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded transition-colors">
                Configure API
              </button>
            </div>
          </aside>
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default App
