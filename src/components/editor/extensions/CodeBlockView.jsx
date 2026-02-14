import React from 'react'
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'

export const CodeBlockView = ({ node, updateAttributes }) => {
  const languages = [
    'javascript',
    'typescript',
    'html',
    'css',
    'python',
    'java',
    'go',
    'rust',
    'sql',
    'json',
    'bash',
    'yaml',
    'markdown',
    'c',
    'cpp',
    'csharp',
    'php',
    'ruby',
    'swift',
    'kotlin',
  ]

  return (
    <NodeViewWrapper className="code-block-wrapper relative group my-4 rounded-lg overflow-hidden bg-black border border-gray-800 shadow-sm">
      <div className="flex justify-between items-center px-4 py-2 bg-gray-900/50 border-b border-gray-800 text-xs text-gray-400">
        <select
          contentEditable={false}
          defaultValue={node.attrs.language}
          onChange={(event) => updateAttributes({ language: event.target.value })}
          className="bg-transparent outline-none cursor-pointer hover:text-white transition-colors appearance-none pr-4 font-mono"
        >
          <option value="null">auto</option>
          <option disabled>—</option>
          {languages.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
            <span className="text-gray-600">
                {node.attrs.language || 'auto'}
            </span>
        </div>
      </div>
      <pre className="!m-0 !p-4 !bg-transparent font-mono text-sm leading-relaxed overflow-x-auto text-gray-300">
        <NodeViewContent as="code" />
      </pre>
    </NodeViewWrapper>
  )
}
