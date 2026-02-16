import React, { useState, useRef, useCallback, memo } from 'react';
import { 
    ChevronRight, 
    ChevronDown, 
    FileText, 
    Folder, 
    FolderOpen, 
} from 'lucide-react';

// Helper to find an item in the tree
const findItem = (items, id) => {
    for (const item of items) {
        if (item.id === id) return item;
        if (item.children) {
            const found = findItem(item.children, id);
            if (found) return found;
        }
    }
    return null;
};

// Helper to check if target is a descendant of source
const isDescendant = (items, sourceId, targetId) => {
    if (sourceId === targetId) return true;
    const source = findItem(items, sourceId);
    if (!source || !source.children) return false;
    return !!findItem(source.children, targetId);
};

// Helper to remove an item from the tree
const removeItem = (items, id) => {
    let removedItem = null;
    const newItems = items.reduce((acc, item) => {
        if (item.id === id) {
            removedItem = item;
            return acc;
        }
        if (item.children) {
            const { newItems: newChildren, removedItem: removed } = removeItem(item.children, id);
            if (removed) removedItem = removed;
            acc.push({ ...item, children: newChildren });
        } else {
            acc.push(item);
        }
        return acc;
    }, []);
    return { newItems, removedItem };
};

// Helper to insert an item into the tree
const insertItem = (items, targetId, itemToInsert, position) => {
    // position: 'before', 'after', 'inside'
    
    // Check if target is at this level
    const targetIndex = items.findIndex(i => i.id === targetId);
    if (targetIndex !== -1) {
        const newItems = [...items];
        if (position === 'inside') {
            // Add to children of target
            const targetItem = newItems[targetIndex];
            newItems[targetIndex] = {
                ...targetItem,
                children: [...(targetItem.children || []), itemToInsert]
            };
            return newItems;
        } else if (position === 'before') {
            newItems.splice(targetIndex, 0, itemToInsert);
            return newItems;
        } else if (position === 'after') {
            newItems.splice(targetIndex + 1, 0, itemToInsert);
            return newItems;
        }
    }

    // Recurse
    return items.map(item => {
        if (item.children) {
            return { 
                ...item, 
                children: insertItem(item.children, targetId, itemToInsert, position) 
            };
        }
        return item;
    });
};

// Item Component
const ChapterItem = memo(({ 
    item, 
    level = 0, 
    activeId, 
    onSelect, 
    onToggle, 
    isExpanded, 
    onContextMenu,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    dragOverInfo
}) => {
    const isFolder = item.type === 'folder';
    const isActive = activeId === item.id;
    
    // Drag visual indicators
    const isOver = dragOverInfo?.id === item.id;
    const position = isOver ? dragOverInfo.position : null;
    
    let style = { paddingLeft: `${level * 12 + 12}px` };
    let className = `
        group flex items-center gap-2 py-1 px-2 cursor-pointer select-none transition-colors border-y-2 border-transparent
        ${isActive ? 'bg-gray-100 dark:bg-gray-800 text-black dark:text-white font-medium' : 'text-gray-600 dark:text-gray-400'}
        hover:bg-gray-100 dark:hover:bg-gray-800
    `;

    if (position === 'before') {
        style.borderTopColor = '#3b82f6';
    } else if (position === 'after') {
        style.borderBottomColor = '#3b82f6';
    } else if (position === 'inside') {
        className += ' bg-blue-50 dark:bg-blue-900/20';
        style.borderColor = '#3b82f6'; // Highlight whole item box
    }

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, item)}
            onDragOver={(e) => onDragOver(e, item)}
            onDrop={(e) => onDrop(e, item)}
            onDragEnd={onDragEnd}
            className={className}
            style={style}
            onClick={(e) => {
                e.stopPropagation();
                if (isFolder) {
                    onToggle(item.id);
                } else {
                    onSelect(item.id);
                }
            }}
            onContextMenu={(e) => onContextMenu(e, item)}
        >
            <span 
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                onClick={(e) => {
                    e.stopPropagation();
                    if (isFolder) onToggle(item.id);
                }}
            >
                {isFolder ? (
                    isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                ) : (
                    <span className="w-3.5 inline-block" /> // Spacer for alignment
                )}
            </span>
            
            {isFolder ? (
                isExpanded ? <FolderOpen size={16} className="text-yellow-500" /> : <Folder size={16} className="text-yellow-500" />
            ) : (
                <FileText size={16} className="text-blue-500" />
            )}
            
            <span className="truncate flex-1 text-sm">{item.title}</span>
        </div>
    );
}, (prev, next) => {
    return prev.item === next.item &&
           prev.activeId === next.activeId &&
           prev.isExpanded === next.isExpanded &&
           prev.level === next.level &&
           (prev.dragOverInfo?.id === prev.item.id ? prev.dragOverInfo : null) === 
           (next.dragOverInfo?.id === next.item.id ? next.dragOverInfo : null) &&
           (prev.dragOverInfo?.id === prev.item.id || next.dragOverInfo?.id === next.item.id ? 
            prev.dragOverInfo === next.dragOverInfo : true);
});

// Recursive List Component
const ChapterTree = memo(({ 
    items, 
    level = 0, 
    activeId, 
    onSelect, 
    onToggle, 
    expandedIds, 
    onContextMenu,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    dragOverInfo
}) => {
    return (
        <>
            {items.map(item => (
                <React.Fragment key={item.id}>
                    <ChapterItem 
                        item={item} 
                        level={level}
                        activeId={activeId}
                        onSelect={onSelect}
                        onToggle={onToggle}
                        isExpanded={expandedIds.includes(item.id)}
                        onContextMenu={onContextMenu}
                        onDragStart={onDragStart}
                        onDragOver={onDragOver}
                        onDrop={onDrop}
                        onDragEnd={onDragEnd}
                        dragOverInfo={dragOverInfo}
                    />
                    {item.type === 'folder' && expandedIds.includes(item.id) && item.children && (
                        <ChapterTree 
                            items={item.children} 
                            level={level + 1}
                            activeId={activeId}
                            onSelect={onSelect}
                            onToggle={onToggle}
                            expandedIds={expandedIds}
                            onContextMenu={onContextMenu}
                            onDragStart={onDragStart}
                            onDragOver={onDragOver}
                            onDrop={onDrop}
                            onDragEnd={onDragEnd}
                            dragOverInfo={dragOverInfo}
                        />
                    )}
                </React.Fragment>
            ))}
        </>
    );
});

const ChapterList = ({ 
    chapters, 
    activeId, 
    onSelect, 
    onChange,
    onContextMenu,
    expanded: controlledExpanded,
    onToggle: controlledOnToggle
}) => {
    const [internalExpanded, setInternalExpanded] = useState([]);
    const [dragOverInfo, setDragOverInfo] = useState(null); // { id, position }
    const draggedItemRef = useRef(null);
    
    const expanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

    const handleToggle = useCallback((id) => {
        if (controlledOnToggle) {
            controlledOnToggle(id);
        } else {
            setInternalExpanded(prev => 
                prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
            );
        }
    }, [controlledOnToggle]);

    // Drag Handlers
    const handleDragStart = useCallback((e, item) => {
        e.stopPropagation();
        draggedItemRef.current = item;
        e.dataTransfer.effectAllowed = 'move';
    }, []);

    const handleDragOver = useCallback((e, targetItem) => {
        e.preventDefault();
        e.stopPropagation();
        
        const draggedItem = draggedItemRef.current;
        if (!draggedItem) return;
        if (draggedItem.id === targetItem.id) return;
        
        // Cannot drag parent into child
        if (isDescendant(chapters, draggedItem.id, targetItem.id)) {
            e.dataTransfer.dropEffect = 'none';
            return;
        }

        e.dataTransfer.dropEffect = 'move';

        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const height = rect.height;
        
        let position;
        
        // Logic for drop position
        if (targetItem.type === 'folder') {
            // Folder zones: 
            // Top 25%: Before
            // Bottom 25%: After
            // Middle 50%: Inside
            if (y < height * 0.25) position = 'before';
            else if (y > height * 0.75) position = 'after';
            else position = 'inside';
        } else {
            // File zones:
            // Top 50%: Before
            // Bottom 50%: After
            if (y < height * 0.5) position = 'before';
            else position = 'after';
        }

        setDragOverInfo(prev => {
            if (prev && prev.id === targetItem.id && prev.position === position) return prev;
            return { id: targetItem.id, position };
        });
    }, [chapters]);

    const handleDrop = useCallback((e, targetItem) => {
        e.preventDefault();
        e.stopPropagation();
        
        const draggedItem = draggedItemRef.current;
        const info = dragOverInfo;
        
        setDragOverInfo(null);
        draggedItemRef.current = null;
        
        if (!draggedItem || !info || info.id !== targetItem.id) return;
        if (draggedItem.id === targetItem.id) return;

        // Execute Move
        // 1. Remove from old location
        const { newItems: itemsWithoutDragged, removedItem } = removeItem(chapters, draggedItem.id);
        
        if (!removedItem) return;

        // 2. Insert to new location
        const newChapters = insertItem(itemsWithoutDragged, targetItem.id, removedItem, info.position);
        
        // 3. Update state
        if (onChange) {
            onChange(newChapters);
        }
        
        // If moved into a folder, ensure that folder is expanded
        if (info.position === 'inside') {
             if (!expanded.includes(targetItem.id)) {
                 handleToggle(targetItem.id);
             }
        }

    }, [chapters, dragOverInfo, expanded, onChange, handleToggle]);

    const handleDragEnd = useCallback(() => {
        setDragOverInfo(null);
        draggedItemRef.current = null;
    }, []);

    // Root Drop Zone Handlers
    const handleRootDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const draggedItem = draggedItemRef.current;
        if (!draggedItem) return;
        
        e.dataTransfer.dropEffect = 'move';
        
        setDragOverInfo(prev => {
            if (prev && prev.id === 'ROOT_END' && prev.position === 'after') return prev;
            return { id: 'ROOT_END', position: 'after' };
        });
    }, []);

    const handleRootDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const draggedItem = draggedItemRef.current;
        if (!draggedItem) return;

        setDragOverInfo(null);
        draggedItemRef.current = null;

        const { newItems: itemsWithoutDragged, removedItem } = removeItem(chapters, draggedItem.id);
        if (!removedItem) return;

        // Add to end of root
        const newChapters = [...itemsWithoutDragged, removedItem];
        if (onChange) onChange(newChapters);
    }, [chapters, onChange]);

    return (
        <div 
            className="flex-1 overflow-y-auto py-2 flex flex-col h-full"
            onDragOver={(e) => {
                e.preventDefault();
            }}
        >
            <div className="flex-shrink-0">
                <ChapterTree 
                    items={chapters} 
                    activeId={activeId}
                    onSelect={onSelect}
                    onToggle={handleToggle}
                    expandedIds={expanded}
                    onContextMenu={onContextMenu}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onDragEnd={handleDragEnd}
                    dragOverInfo={dragOverInfo}
                />
            </div>
            
            {/* Root Drop Zone - Takes up remaining space */}
            <div 
                className={`flex-grow min-h-[50px] transition-colors ${dragOverInfo?.id === 'ROOT_END' ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                onDragOver={handleRootDragOver}
                onDrop={handleRootDrop}
            >
                {dragOverInfo?.id === 'ROOT_END' && (
                    <div className="h-0.5 bg-blue-500 w-full mt-0" />
                )}
            </div>
        </div>
    );
};

export default memo(ChapterList);
