import React, { useState, useEffect, useImperativeHandle, forwardRef, useRef } from 'react'
import clsx from 'clsx'

export const CommandList = forwardRef((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const scrollContainerRef = useRef(null)

  const sections = []
  const groupedItems = new Map()

  props.items.forEach((item) => {
    const section = item.section || 'Other'
    if (!groupedItems.has(section)) {
      groupedItems.set(section, [])
      sections.push(section)
    }
    groupedItems.get(section).push(item)
  })
  const flatItems = sections.flatMap((section) => groupedItems.get(section))

  const selectItem = (value) => {
    const item = typeof value === 'number' ? flatItems[value] : value
    if (item) {
      props.command(item)
    }
  }

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    // Find the currently selected button element
    // Since we have nested structure (sections -> buttons), we need to find the button by its index
    // The structure is div (container) -> div (section wrapper) -> button (item)
    // So we can select all buttons inside the container
    const buttons = container.querySelectorAll('button')
    const activeIndex = flatItems.length ? selectedIndex % flatItems.length : 0
    const selectedElement = buttons[activeIndex]

    if (selectedElement) {
        const containerHeight = container.offsetHeight
        const elementHeight = selectedElement.offsetHeight
        const scrollTop = container.scrollTop

      let offset = selectedElement.offsetTop
      let parent = selectedElement.offsetParent
        while (parent && parent !== container) {
        offset += parent.offsetTop
        parent = parent.offsetParent
        }

        if (offset < scrollTop) {
        container.scrollTop = offset
        } else if (offset + elementHeight > scrollTop + containerHeight) {
        container.scrollTop = offset + elementHeight - containerHeight
        }
    }
  }, [selectedIndex, flatItems.length])

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (!flatItems.length) {
        return false
      }
      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + flatItems.length - 1) % flatItems.length)
        return true
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % flatItems.length)
        return true
      }
      if (event.key === 'Enter') {
        selectItem(selectedIndex % flatItems.length)
        return true
      }
      return false
    },
  }))

  if (!flatItems.length) {
    return null
  }

  const activeIndex = flatItems.length ? selectedIndex % flatItems.length : 0
  let renderIndex = 0

  return (
    <div className="z-50 w-[200px] overflow-hidden rounded-[0.75rem] border border-gray-200 bg-white shadow-xl transition-all">
      <div 
        ref={scrollContainerRef}
        className="p-1 max-h-[300px] overflow-y-auto slash-menu-scroll"
      >
        {sections.map((section) => (
          <div key={section}>
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 py-1 mt-1 mb-0.5">
              {section}
            </div>
            {groupedItems.get(section).map((item) => {
              const currentIndex = renderIndex++
              return (
                <button
                  key={`${section}-${item.title}`}
                  className={clsx(
                    'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors',
                    currentIndex === activeIndex && 'bg-gray-100 text-gray-900'
                  )}
                  onClick={() => selectItem(item)}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded border border-gray-200 bg-white text-gray-500">
                    {item.icon}
                  </div>
                  <span className="font-medium text-xs">{item.title}</span>
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
})

CommandList.displayName = 'CommandList'
