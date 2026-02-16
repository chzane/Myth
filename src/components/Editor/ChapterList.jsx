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

// Helper to remove items from the tree
const removeItems = (items, idsToRemove) => {
    const removed = [];
    const recurse = (currentItems) => {
        return currentItems.reduce((acc, item) => {
            if (idsToRemove.has(item.id)) {
                removed.push(item);
                return acc;
            }
            if (item.children) {
                const newChildren = recurse(item.children);
                acc.push({ ...item, children: newChildren });
            } else {
                acc.push(item);
            }
            return acc;
        }, []);
    };
    const newItems = recurse(items);
    return { newItems, removedItems: removed };
};

// Helper to remove a single item (legacy wrapper or unused)
const removeItem = (items, id) => {
    const { newItems, removedItems } = removeItems(items, new Set([id]));
    return { newItems, removedItem: removedItems[0] };
};

// Helper to insert items into the tree
const insertItems = (items, targetId, itemsToInsert, position) => {
    const targetIndex = items.findIndex(i => i.id === targetId);
    if (targetIndex !== -1) {
        const newItems = [...items];
        if (position === 'inside') {
            const targetItem = newItems[targetIndex];
            newItems[targetIndex] = {
                ...targetItem,
                children: [...(targetItem.children || []), ...itemsToInsert]
            };
            return newItems;
        } else if (position === 'before') {
            newItems.splice(targetIndex, 0, ...itemsToInsert);
            return newItems;
        } else if (position === 'after') {
            newItems.splice(targetIndex + 1, 0, ...itemsToInsert);
            return newItems;
        }
    }

    return items.map(item => {
        if (item.children) {
            return { 
                ...item, 
                children: insertItems(item.children, targetId, itemsToInsert, position) 
            };
        }
        return item;
    });
};

// Helper to insert a single item (legacy wrapper)
const insertItem = (items, targetId, itemToInsert, position) => {
    return insertItems(items, targetId, [itemToInsert], position);
};

// Item Component
const ChapterItem = memo(({ 
    item, 
    level = 0, 
    activeId,
    selectedIds,
    onSelect, 
    onToggle, 
    isExpanded, 
    onContextMenu,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    dragOverInfo,
    onRename
}) => {
    const isFolder = item.type === 'folder';
    const isActive = activeId === item.id;
    const isSelected = selectedIds ? selectedIds.has(item.id) : isActive;
    
    // Drag visual indicators
    const isOver = dragOverInfo?.id === item.id;
    const position = isOver ? dragOverInfo.position : null;
    
    // Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(item.title);

    const handleDoubleClick = (e) => {
        e.stopPropagation();
        if (onRename) {
            setIsEditing(true);
            setEditValue(item.title);
        }
    };

    const handleSave = () => {
        if (editValue.trim() && editValue !== item.title) {
            onRename(item.id, editValue);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setEditValue(item.title);
        }
    };
    
    let style = { paddingLeft: `${level * 12 + 12}px` };
    let className = `
        group flex items-center gap-2 py-1 px-2 cursor-pointer select-none transition-colors border-y-2 border-transparent
        ${(isSelected || isActive) ? 'bg-gray-100 dark:bg-gray-800 text-black dark:text-white font-medium' : 'text-gray-600 dark:text-gray-400'}
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
            draggable={!isEditing}
            onDragStart={(e) => !isEditing && onDragStart(e, item)}
            onDragOver={(e) => onDragOver(e, item)}
            onDrop={(e) => onDrop(e, item)}
            onDragEnd={onDragEnd}
            className={className}
            style={style}
            onClick={(e) => {
                e.stopPropagation();
                if (isEditing) return;
                if (isFolder) {
                    onToggle(item.id);
                    // Also select it if needed? Usually clicking folder toggles it.
                    // But maybe we want to select it too?
                    // Let's pass event to onSelect just in case we want to select folder.
                    // But current logic: click folder -> toggle.
                    // If we want to multi-select folders, we might need to handle click differently.
                    // For now, assume folder click = toggle.
                    // If modifier key is pressed, maybe select?
                    if (e.ctrlKey || e.metaKey || e.shiftKey) {
                        onSelect(item.id, e);
                    }
                } else {
                    onSelect(item.id, e);
                }
            }}
            onContextMenu={(e) => onContextMenu(e, item)}
        >
            <span 
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                onClick={(e) => {
                    e.stopPropagation();
                    if (isEditing) return;
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
            
            {isEditing ? (
                <input 
                    type="text" 
                    value={editValue} 
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className="flex-1 min-w-0 bg-white dark:bg-black border border-blue-500 rounded px-1 text-sm focus:outline-none"
                    onClick={(e) => e.stopPropagation()} 
                />
            ) : (
                <span 
                    className="truncate flex-1 text-sm"
                    onDoubleClick={handleDoubleClick}
                >
                    {item.title}
                </span>
            )}
        </div>
    );
}, (prev, next) => {
    return prev.item === next.item &&
           prev.activeId === next.activeId &&
           (prev.selectedIds === next.selectedIds || 
            (prev.selectedIds?.has(prev.item.id) === next.selectedIds?.has(next.item.id))) &&
           prev.isExpanded === next.isExpanded &&
           prev.level === next.level &&
           (prev.dragOverInfo?.id === prev.item.id ? prev.dragOverInfo : null) === 
           (next.dragOverInfo?.id === next.item.id ? next.dragOverInfo : null) &&
           (prev.dragOverInfo?.id === prev.item.id || next.dragOverInfo?.id === next.item.id ? 
            prev.dragOverInfo === next.dragOverInfo : true) &&
           prev.onRename === next.onRename;
});

// Recursive List Component
const ChapterTree = memo(({ 
    items, 
    level = 0, 
    activeId,
    selectedIds,
    onSelect, 
    onToggle, 
    expandedIds, 
    onContextMenu,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    dragOverInfo,
    onRename
}) => {
    return (
        <>
            {items.map(item => (
                <React.Fragment key={item.id}>
                    <ChapterItem 
                        item={item} 
                        level={level}
                        activeId={activeId}
                        selectedIds={selectedIds}
                        onSelect={onSelect}
                        onToggle={onToggle}
                        isExpanded={expandedIds.includes(item.id)}
                        onContextMenu={onContextMenu}
                        onDragStart={onDragStart}
                        onDragOver={onDragOver}
                        onDrop={onDrop}
                        onDragEnd={onDragEnd}
                        dragOverInfo={dragOverInfo}
                        onRename={onRename}
                    />
                    {item.type === 'folder' && expandedIds.includes(item.id) && item.children && (
                        <ChapterTree 
                            items={item.children} 
                            level={level + 1}
                            activeId={activeId}
                            selectedIds={selectedIds}
                            onSelect={onSelect}
                            onToggle={onToggle}
                            expandedIds={expandedIds}
                            onContextMenu={onContextMenu}
                            onDragStart={onDragStart}
                            onDragOver={onDragOver}
                            onDrop={onDrop}
                            onDragEnd={onDragEnd}
                            dragOverInfo={dragOverInfo}
                            onRename={onRename}
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
    selectedIds,
    onSelect, 
    onChange,
    onContextMenu,
    expanded: controlledExpanded,
    onToggle: controlledOnToggle,
    onRename
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
        
        let itemsToDrag = [item.id];
        if (selectedIds && selectedIds.has(item.id)) {
            itemsToDrag = Array.from(selectedIds);
        } else {
             // If dragging unselected item, treat as single selection
             // But we should probably select it?
             // Calling onSelect here might be risky during drag start?
             // Let's just drag it.
             if (onSelect) onSelect(item.id, {}); 
             itemsToDrag = [item.id];
        }
        
        draggedItemRef.current = itemsToDrag;
        e.dataTransfer.effectAllowed = 'move';
    }, [selectedIds, onSelect]);

    const handleDragOver = useCallback((e, targetItem) => {
        e.preventDefault();
        e.stopPropagation();
        
        const draggedIds = draggedItemRef.current;
        if (!draggedIds) return;
        
        // Cannot drag into self
        if (draggedIds.includes(targetItem.id)) return;
        
        // Cannot drag parent into child
        for (const id of draggedIds) {
            if (isDescendant(chapters, id, targetItem.id)) {
                e.dataTransfer.dropEffect = 'none';
                return;
            }
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
            // Middle zone for folder conversion? No.
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
        
        const draggedIds = draggedItemRef.current;
        const info = dragOverInfo;
        
        setDragOverInfo(null);
        draggedItemRef.current = null;
        
        if (!draggedIds || !info || info.id !== targetItem.id) return;
        if (draggedIds.includes(targetItem.id)) return;

        // Execute Move
        const idsSet = new Set(draggedIds);
        // 1. Remove from old location
        const { newItems: itemsWithoutDragged, removedItems } = removeItems(chapters, idsSet);
        
        if (removedItems.length === 0) return;

        // 2. Insert to new location
        const newChapters = insertItems(itemsWithoutDragged, targetItem.id, removedItems, info.position);
        
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
        
        const draggedIds = draggedItemRef.current;
        if (!draggedIds) return;
        
        e.dataTransfer.dropEffect = 'move';
        
        setDragOverInfo(prev => {
            if (prev && prev.id === 'ROOT_END' && prev.position === 'after') return prev;
            return { id: 'ROOT_END', position: 'after' };
        });
    }, []);

    const handleRootDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const draggedIds = draggedItemRef.current;
        if (!draggedIds) return;

        setDragOverInfo(null);
        draggedItemRef.current = null;

        const idsSet = new Set(draggedIds);
        const { newItems: itemsWithoutDragged, removedItems } = removeItems(chapters, idsSet);
        if (removedItems.length === 0) return;

        // Add to end of root
        const newChapters = [...itemsWithoutDragged, ...removedItems];
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
                    selectedIds={selectedIds}
                    onSelect={onSelect}
                    onToggle={handleToggle}
                    expandedIds={expanded}
                    onContextMenu={onContextMenu}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onDragEnd={handleDragEnd}
                    dragOverInfo={dragOverInfo}
                    onRename={onRename}
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
