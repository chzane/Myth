import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    Plus, FileText, ChevronRight, ChevronLeft,
    Settings, Moon, Sun, Maximize, Minimize,
    Save, MoreHorizontal, List, AlignLeft, ArrowLeft,
    FolderPlus, Trash2, Edit2, Scissors, Clipboard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MythEditor from '../components/MythEditor/MythEditor.jsx';
import ChapterList from '../components/Editor/ChapterList.jsx';
import WordCountBar from '../components/Editor/WordCountBar.jsx';
import RightSidebar from '../components/Editor/RightSidebar.jsx';
import { useBook } from '../contexts/BookContext';
import BookManager from '../utils/BookManager';
import Modal from '../components/UI/Modal';

function EditorPage() {
    const navigate = useNavigate();
    const { currentBook, currentBookData, saveBookData } = useBook();

    // Data State
    const [chapters, setChapters] = useState([]);
    const [expandedChapters, setExpandedChapters] = useState([]); // Lifted state
    const [openChapters, setOpenChapters] = useState(new Set());
    const [loadedContents, setLoadedContents] = useState({});
    const [currentChapterId, setCurrentChapterId] = useState(null);
    const [isLoadingContent, setIsLoadingContent] = useState(false);

    // UI State
    const [showSidebar, setShowSidebar] = useState(true);
    const [showOutline, setShowOutline] = useState(true);
    const [focusMode, setFocusMode] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [spellCheckEnabled, setSpellCheckEnabled] = useState(false);
    const [chapterSpellErrors, setChapterSpellErrors] = useState({}); // { [chapterId]: Error[] }
    const [contextMenu, setContextMenu] = useState(null);
    const [clipboard, setClipboard] = useState(null); // { id: string, action: 'cut' }

    // Rename Modal State
    const [renameModal, setRenameModal] = useState({ open: false, itemId: null, name: '' });

    // Editor State
    const [outline, setOutline] = useState([]);

    // Sidebar State
    const [leftSidebarVisible, setLeftSidebarVisible] = useState(true);
    const [rightSidebarVisible, setRightSidebarVisible] = useState(true);
    const [leftSidebarWidth, setLeftSidebarWidth] = useState(256);
    const [rightSidebarWidth, setRightSidebarWidth] = useState(256);
    const [isResizingLeft, setIsResizingLeft] = useState(false);
    const [isResizingRight, setIsResizingRight] = useState(false);
    
    // Multi-select State
    const [selectedIds, setSelectedIds] = useState(new Set());

    // Sidebar Resizing Effect
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isResizingLeft) {
                const newWidth = Math.min(Math.max(e.clientX, 200), 500);
                setLeftSidebarWidth(newWidth);
            }
            if (isResizingRight) {
                const newWidth = Math.min(Math.max(window.innerWidth - e.clientX, 200), 500);
                setRightSidebarWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizingLeft(false);
            setIsResizingRight(false);
            document.body.style.cursor = 'default';
            // Disable text selection during resize
            document.body.style.userSelect = 'auto';
        };

        if (isResizingLeft || isResizingRight) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
        };
    }, [isResizingLeft, isResizingRight]);

    // Refs for stable callbacks
    const chaptersRef = useRef(chapters);
    useEffect(() => {
        chaptersRef.current = chapters;
    }, [chapters]);

    useEffect(() => {
        if (focusMode) {
            setLeftSidebarVisible(false);
            setRightSidebarVisible(false);
        } else {
            setLeftSidebarVisible(showSidebar);
            setRightSidebarVisible(showOutline);
        }
    }, [focusMode, showSidebar, showOutline]);

    useEffect(() => {
        if (spellCheckEnabled && !focusMode) {
            setRightSidebarVisible(true);
        }
    }, [spellCheckEnabled, focusMode]);
    const [lastSaved, setLastSaved] = useState(null);
    const editorRefs = useRef({});
    const saveTimeoutRef = useRef(null);

    // Load chapters from context
    useEffect(() => {
        if (currentBookData?.chapters) {
            // Migration: Ensure all items have type
            const migrateChapters = (items) => {
                return items.map(item => ({
                    ...item,
                    type: item.type || 'file',
                    children: item.children ? migrateChapters(item.children) : []
                }));
            };
            setChapters(migrateChapters(currentBookData.chapters));
        }
    }, [currentBookData]);

    // Focus Mode & Dark Mode Effects
    useEffect(() => {
        if (focusMode) {
            document.documentElement.requestFullscreen().catch((e) => console.log(e));
        } else {
            if (document.fullscreenElement) {
                document.exitFullscreen().catch((e) => console.log(e));
            }
        }
    }, [focusMode]);

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    // Click outside context menu to close it
    useEffect(() => {
        const handleClick = (e) => {
            // Check if click is inside context menu
            const menu = document.getElementById('context-menu-container');
            if (menu && menu.contains(e.target)) {
                return;
            }
            setContextMenu(null);
        };
        
        // Use capture phase to ensure we catch clicks even if propagation is stopped
        window.addEventListener('click', handleClick, true);
        window.addEventListener('contextmenu', handleClick, true);
        
        return () => {
            window.removeEventListener('click', handleClick, true);
            window.removeEventListener('contextmenu', handleClick, true);
        };
    }, []);

    // Helper to find chapter in tree
    const findChapter = useCallback((items, id) => {
        for (const item of items) {
            if (item.id === id) return item;
            if (item.children) {
                const found = findChapter(item.children, id);
                if (found) return found;
            }
        }
        return null;
    }, []);

    const extractOutline = useCallback((content) => {
        if (!content) return [];
        return content
            .filter(block => block.type === 'heading')
            .map(block => ({
                id: block.id,
                text: block.content && block.content[0]?.text ? block.content[0].text : '无标题',
                level: block.props.level
            }));
    }, []);

    const breadcrumbs = useMemo(() => {
        if (!currentChapterId) return [];
        const path = [];
        const find = (nodes) => {
            for (const node of nodes) {
                if (node.id === currentChapterId) {
                    path.push(node);
                    return true;
                }
                if (node.children) {
                    if (find(node.children)) {
                        path.unshift(node);
                        return true;
                    }
                }
            }
            return false;
        };
        find(chapters);
        return path;
    }, [chapters, currentChapterId]);

    // Keyboard Navigation Helpers
    const flattenVisibleItems = useCallback((items, expandedIds) => {
        const result = [];
        const traverse = (nodes) => {
            for (const node of nodes) {
                result.push(node);
                if (node.type === 'folder' && expandedIds.includes(node.id) && node.children) {
                    traverse(node.children);
                }
            }
        };
        traverse(items);
        return result;
    }, []);

    const handleSelectChapter = useCallback(async (chapterId, event) => {
        // Multi-select Logic
        if (event && (event.shiftKey || event.metaKey || event.ctrlKey)) {
            const visibleItems = flattenVisibleItems(chapters, expandedChapters);
            let newSelection = new Set(selectedIds);

            if (event.shiftKey && currentChapterId) {
                // Range select
                const startIdx = visibleItems.findIndex(i => i.id === currentChapterId);
                const endIdx = visibleItems.findIndex(i => i.id === chapterId);
                
                if (startIdx !== -1 && endIdx !== -1) {
                    const min = Math.min(startIdx, endIdx);
                    const max = Math.max(startIdx, endIdx);
                    
                    // If not holding Ctrl/Cmd, clear previous selection first
                    if (!event.metaKey && !event.ctrlKey) {
                        newSelection = new Set();
                    }
                    
                    for (let i = min; i <= max; i++) {
                        newSelection.add(visibleItems[i].id);
                    }
                }
            } else if (event.metaKey || event.ctrlKey) {
                // Toggle
                if (newSelection.has(chapterId)) {
                    newSelection.delete(chapterId);
                } else {
                    newSelection.add(chapterId);
                }
            }
            
            setSelectedIds(newSelection);
            setCurrentChapterId(chapterId);
        } else {
            // Single select
            setSelectedIds(new Set([chapterId]));
            setCurrentChapterId(prev => {
                if (prev === chapterId) return prev;
                return chapterId;
            });
            setOpenChapters(prev => {
                if (prev.has(chapterId)) return prev;
                return new Set(prev).add(chapterId);
            });
        }

        // Load content for the focused item
        const content = await BookManager.loadChapterContent(currentBook.path, chapterId);
        if (content) {
            setLoadedContents(prev => ({ ...prev, [chapterId]: content }));
            const newOutline = extractOutline(content);
            setOutline(newOutline);
        }
        
    }, [currentBook?.path, extractOutline, chapters, expandedChapters, currentChapterId, selectedIds, flattenVisibleItems]);

    const handleCreateChapter = useCallback(async (parentId = null) => {
        const newChapter = {
            id: Date.now().toString(),
            title: '新章节',
            type: 'file',
            createdAt: new Date().toISOString()
        };

        const initialContent = [
            { type: "heading", props: { level: 1 }, content: newChapter.title },
            { type: "paragraph", content: "开始写作..." }
        ];

        // We need 'chapters' here.
        // Functional update for setChapters is best to avoid dependency on 'chapters'
        let updatedChapters = [];
        
        setChapters(prevChapters => {
            const addNode = (items) => {
                if (!parentId) return [...items, newChapter];
                return items.map(item => {
                    if (item.id === parentId) {
                        return { ...item, children: [...(item.children || []), newChapter] };
                    }
                    if (item.children) {
                        return { ...item, children: addNode(item.children) };
                    }
                    return item;
                });
            };
            updatedChapters = addNode(prevChapters);
            return updatedChapters;
        });
        
        // We need to wait for state update? No, we have the calculated value.
        // But we need to save to disk.
        // We can't put async save inside setChapters updater.
        // So we might need to use a ref or just depend on chapters.
        // Depending on chapters is safer for logic simplicity.
        // I will depend on chapters.
        
    }, []); // This is broken if I don't depend on chapters or use functional updates correctly.
    // Let's revert to depending on chapters for creation/deletion actions as they are rare.
    // The critical one is handleSelectChapter and handleEditorChange.

    // Re-implementing handleCreateChapter with deps
    const handleCreateChapterWithDeps = useCallback(async (parentId = null) => {
        const newChapter = {
            id: Date.now().toString(),
            title: '新章节',
            type: 'file',
            createdAt: new Date().toISOString()
        };

        const initialContent = [
            { type: "heading", props: { level: 1 }, content: newChapter.title },
            { type: "paragraph", content: "开始写作..." }
        ];

        const addNode = (items) => {
            if (!parentId) return [...items, newChapter];
            return items.map(item => {
                if (item.id === parentId) {
                    return { ...item, children: [...(item.children || []), newChapter] };
                }
                if (item.children) {
                    return { ...item, children: addNode(item.children) };
                }
                return item;
            });
        };

        const updatedChapters = addNode(chapters);
        setChapters(updatedChapters);
        await saveBookData('chapters', updatedChapters);
        await BookManager.saveChapterContent(currentBook.path, newChapter.id, initialContent);
        
        // Also expand parent if needed
        if (parentId && !expandedChapters.includes(parentId)) {
            setExpandedChapters(prev => [...prev, parentId]);
        }

        await handleSelectChapter(newChapter.id);
    }, [chapters, currentBook?.path, expandedChapters, handleSelectChapter, saveBookData]);

    const handleCreateFolder = useCallback(async () => {
        const newFolder = {
            id: Date.now().toString(),
            title: '新建文件夹',
            type: 'folder',
            children: [],
            createdAt: new Date().toISOString()
        };
        const updatedChapters = [...chapters, newFolder];
        setChapters(updatedChapters);
        await saveBookData('chapters', updatedChapters);
    }, [chapters, saveBookData]);

    const handleDelete = useCallback(async (itemId) => {
        const idsToDelete = (selectedIds.has(itemId)) 
            ? Array.from(selectedIds) 
            : [itemId];

        if (!window.confirm(`确定要删除这 ${idsToDelete.length} 项吗？此操作不可恢复。`)) return;

        const idsSet = new Set(idsToDelete);

        const deleteNode = (items) => {
            return items.filter(item => !idsSet.has(item.id)).map(item => ({
                ...item,
                children: item.children ? deleteNode(item.children) : []
            }));
        };

        const updatedChapters = deleteNode(chapters);
        setChapters(updatedChapters);
        await saveBookData('chapters', updatedChapters);

        if (idsSet.has(currentChapterId)) {
            setCurrentChapterId(null);
            setOutline([]);
        }
        
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            idsToDelete.forEach(id => newSet.delete(id));
            return newSet;
        });
    }, [chapters, currentChapterId, saveBookData, selectedIds]);

    const handleRename = useCallback(async (itemId, newName) => {
        const updateNode = (items) => {
            return items.map(item => {
                if (item.id === itemId) {
                    return { ...item, title: newName };
                }
                if (item.children) {
                    return { ...item, children: updateNode(item.children) };
                }
                return item;
            });
        };
        const updatedChapters = updateNode(chaptersRef.current);
        setChapters(updatedChapters);
        await saveBookData('chapters', updatedChapters);
    }, [saveBookData]);

    // Handle Expand Toggle
    const handleToggleExpand = useCallback((id) => {
        setExpandedChapters(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    }, []);

    // Keyboard Navigation Effect
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Only handle if no modal is open (simple check)
            if (document.querySelector('.fixed.z-\\[100\\]')) return;

            // Alt + Up/Down for Navigation
            if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
                e.preventDefault();
                const visibleItems = flattenVisibleItems(chapters, expandedChapters);
                const currentIndex = visibleItems.findIndex(i => i.id === currentChapterId);
                
                if (currentIndex === -1 && visibleItems.length > 0) {
                    // Select first if nothing selected
                    handleSelectChapter(visibleItems[0].id);
                    return;
                }

                if (e.key === 'ArrowUp') {
                    if (currentIndex > 0) {
                        const prev = visibleItems[currentIndex - 1];
                        if (prev.type === 'folder') {
                            // If previous is folder, should we select it? 
                            // Current logic in handleSelectChapter ignores folders.
                            // So we should find previous FILE.
                            // Or maybe we allow selecting folders visually?
                            // For now, let's just try to select it. 
                            // If handleSelectChapter ignores it, we might get stuck.
                            // Let's modify handleSelectChapter or logic here.
                            
                            // Better: find previous file
                            let i = currentIndex - 1;
                            while (i >= 0 && visibleItems[i].type === 'folder') {
                                i--;
                            }
                            if (i >= 0) handleSelectChapter(visibleItems[i].id);
                        } else {
                            handleSelectChapter(prev.id);
                        }
                    }
                } else {
                    if (currentIndex < visibleItems.length - 1) {
                        const next = visibleItems[currentIndex + 1];
                        if (next.type === 'folder') {
                             // Skip folders
                            let i = currentIndex + 1;
                            while (i < visibleItems.length && visibleItems[i].type === 'folder') {
                                i++;
                            }
                            if (i < visibleItems.length) handleSelectChapter(visibleItems[i].id);
                        } else {
                            handleSelectChapter(next.id);
                        }
                    }
                }
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [chapters, expandedChapters, currentChapterId, flattenVisibleItems, handleSelectChapter]);


    // Stable handleEditorChange
    // We need to pass a stable function to MythEditor to avoid re-renders.
    // But it depends on chapterId.
    // We can use a factory component or just useCallback with dependency on chapterId.
    // Since we render MythEditor in a map, we can't use hooks inside map.
    // Best way: Create a wrapper component `ChapterEditor`.
    
    const handleChaptersChange = useCallback(async (newChapters) => {
        setChapters(newChapters);
        await saveBookData('chapters', newChapters);
    }, [saveBookData]);

    const handleContextMenu = useCallback((e, item) => {
        e.preventDefault();
        e.stopPropagation();

        if (item && !selectedIds.has(item.id)) {
            // Right clicked on unselected item -> select it
            setSelectedIds(new Set([item.id]));
            setCurrentChapterId(item.id);
        }

        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            item
        });
    }, [selectedIds]);

    const handleCut = useCallback((itemId) => {
        setClipboard({ id: itemId, action: 'cut' });
        setContextMenu(null);
    }, []);

    const handlePaste = useCallback(async (targetId) => {
        if (!clipboard) return;
        const { id: sourceId } = clipboard;
        
        // Logic ... (Keep existing logic but move inside callback)
        // Since logic is complex and uses recursion, we can define helpers inside or outside.
        // For brevity in this useCallback, I'll copy the logic.
        
        let sourceItem = null;
        const removeSource = (items) => {
            const index = items.findIndex(i => i.id === sourceId);
            if (index > -1) {
                sourceItem = items[index];
                return items.filter(i => i.id !== sourceId);
            }
            return items.map(item => ({
                ...item,
                children: item.children ? removeSource(item.children) : []
            }));
        };
        
        const chaptersCopy = JSON.parse(JSON.stringify(chapters));
        const chaptersWithoutSource = removeSource(chaptersCopy);
        
        if (!sourceItem) {
            setContextMenu(null);
            return;
        }

        const addToTarget = (items) => {
            if (!targetId) return [...items, sourceItem];
            return items.map(item => {
                if (item.id === targetId) {
                    return { ...item, children: [...(item.children || []), sourceItem] };
                }
                if (item.children) {
                    return { ...item, children: addToTarget(item.children) };
                }
                return item;
            });
        };
        
        const newChapters = addToTarget(chaptersWithoutSource);
        setChapters(newChapters);
        await saveBookData('chapters', newChapters);
        setClipboard(null);
        setContextMenu(null);
    }, [clipboard, chapters, saveBookData]);

    // Stats Helper
    const handleStatsUpdate = useCallback((chapterId, stats) => {
        const updateNode = (items) => {
            return items.map(item => {
                if (item.id === chapterId) {
                    return { ...item, stats };
                }
                if (item.children) {
                    const children = updateNode(item.children);
                    // Check if children actually changed
                    if (JSON.stringify(children) !== JSON.stringify(item.children)) {
                        return { ...item, children };
                    }
                }
                return item;
            });
        };

        setChapters(prev => {
            const updated = updateNode(prev);
            // Avoid state update if nothing changed
            if (JSON.stringify(updated) === JSON.stringify(prev)) return prev;
            return updated;
        });
        
    }, []);

    // Effect to save chapters when stats change?
    // Let's use a ref to track if we need to save.
    const chaptersSaveTimeoutRef = useRef(null);
    useEffect(() => {
        if (chaptersSaveTimeoutRef.current) clearTimeout(chaptersSaveTimeoutRef.current);
        chaptersSaveTimeoutRef.current = setTimeout(() => {
            if (chapters.length > 0) {
                 saveBookData('chapters', chapters);
            }
        }, 2000);
        return () => clearTimeout(chaptersSaveTimeoutRef.current);
    }, [chapters, saveBookData]);

    const calculateTotalStats = useCallback(() => {
        let total = { chinese: 0, english: 0, special: 0, total: 0 };
        const traverse = (items) => {
            for (const item of items) {
                if (item.stats) {
                    total.chinese += item.stats.chinese || 0;
                    total.english += item.stats.english || 0;
                    total.special += item.stats.special || 0;
                    total.total += item.stats.total || 0;
                }
                if (item.children) traverse(item.children);
            }
        };
        traverse(chapters);
        return total;
    }, [chapters]);

    const currentStats = useMemo(() => {
        const find = (items) => {
            for (const item of items) {
                if (item.id === currentChapterId) return item.stats || { chinese: 0, english: 0, special: 0, total: 0 };
                if (item.children && item.children.length > 0) {
                    const found = find(item.children);
                    if (found) return found;
                }
            }
            return null;
        };
        return find(chapters) || { chinese: 0, english: 0, special: 0, total: 0 };
    }, [chapters, currentChapterId]);

    const totalStats = useMemo(() => calculateTotalStats(), [calculateTotalStats]);

    const handleJumpToHeading = useCallback((blockId) => {
        const editor = editorRefs.current[currentChapterId];
        if (editor) {
            const element = document.querySelector(`[data-id="${blockId}"]`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                editor.setTextCursorPosition(blockId, 'end');
                editor.focus();
            }
        }
    }, [currentChapterId]);

    const handleJumpToError = useCallback((error) => {
        const editor = editorRefs.current[currentChapterId];
        if (editor && editor._tiptapEditor) {
            const tiptap = editor._tiptapEditor;
            tiptap.commands.setTextSelection({ from: error.from, to: error.to });
            tiptap.commands.scrollIntoView();
            tiptap.view.focus();
        }
    }, [currentChapterId]);

    // Spell errors for current chapter
    const currentSpellErrors = useMemo(() => {
        return currentChapterId ? (chapterSpellErrors[currentChapterId] || []) : [];
    }, [chapterSpellErrors, currentChapterId]);

    const handleSpellCheckErrors = useCallback((chapterId, errors) => {
        setChapterSpellErrors(prev => {
            // Only update if errors actually changed to avoid infinite loops if referentially unstable
            if (JSON.stringify(prev[chapterId]) === JSON.stringify(errors)) return prev;
            return { ...prev, [chapterId]: errors };
        });
    }, []);

    if (!currentBook) return <div className="flex items-center justify-center h-screen">Loading...</div>;

    return (
        <div className={`flex flex-col h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'} transition-colors duration-300`}>
            {/* Top Menu Bar */}
            {!focusMode && (
                <div className={`h-14 border-b flex items-center justify-between px-4 shrink-0 ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                    <div className="flex items-center gap-4 overflow-hidden">
                        <button onClick={() => navigate('/')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 shrink-0"><ArrowLeft size={20} /></button>
                        <div className="flex items-center gap-2 text-sm overflow-hidden whitespace-nowrap">
                            <span className="font-bold shrink-0">{currentBook.title}</span>
                            {breadcrumbs.length > 0 ? (
                                breadcrumbs.map((item, index) => (
                                    <React.Fragment key={item.id}>
                                        <ChevronRight size={16} className="text-gray-400 shrink-0" />
                                        <span className={`truncate ${index === breadcrumbs.length - 1 ? "text-gray-500" : "text-gray-700 dark:text-gray-300"}`}>
                                            {item.title}
                                        </span>
                                    </React.Fragment>
                                ))
                            ) : (
                                <>
                                    <ChevronRight size={16} className="text-gray-400 shrink-0" />
                                    <span className="text-gray-500">选择章节</span>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 mr-4">{lastSaved && `已保存 ${lastSaved.toLocaleTimeString()}`}</span>
                        <button onClick={() => setFocusMode(true)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" title="专注模式"><Maximize size={20} /></button>
                        <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" title="切换模式">{darkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
                        <div className="h-6 w-px bg-gray-200 mx-2" />
                        <button onClick={() => setShowSidebar(!showSidebar)} className={`p-2 rounded-lg ${showSidebar ? 'bg-gray-100 dark:bg-gray-800' : ''}`}><AlignLeft size={20} /></button>
                        <button onClick={() => setShowOutline(!showOutline)} className={`p-2 rounded-lg ${showOutline ? 'bg-gray-100 dark:bg-gray-800' : ''}`}><List size={20} /></button>
                    </div>
                </div>
            )}

            {/* Main Area */}
            <div className="flex-1 flex overflow-hidden relative">
                {focusMode && (
                    <button onClick={() => setFocusMode(false)} className="absolute top-4 right-4 z-50 p-2 bg-black/10 hover:bg-black/20 rounded-full text-gray-500 hover:text-black">
                        <Minimize size={20} />
                    </button>
                )}

                {/* Left Sidebar */}
                <div
                    className={`
                        border-r flex flex-col shrink-0 transition-all duration-300 ease-in-out
                        ${leftSidebarVisible ? 'opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-full overflow-hidden'}
                        ${darkMode ? 'border-gray-800 bg-gray-900/60 backdrop-blur-md' : 'border-gray-200 bg-white/60 backdrop-blur-md'}
                    `}
                    style={{ width: leftSidebarVisible ? leftSidebarWidth : 0 }}
                    onContextMenu={(e) => handleContextMenu(e, null)}
                >
                    <div className="p-4 border-b border-gray-200/50 dark:border-gray-800/50 flex justify-between items-center whitespace-nowrap overflow-hidden">
                        <span className="font-medium text-sm text-gray-500">章节列表</span>
                        <div className="flex gap-1">
                            <button onClick={handleCreateFolder} className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors" title="新建文件夹"><FolderPlus size={18} /></button>
                            <button onClick={() => handleCreateChapterWithDeps()} className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors" title="新建章节"><Plus size={18} /></button>
                        </div>
                    </div>
                    <ChapterList
                        chapters={chapters}
                        activeId={currentChapterId}
                        selectedIds={selectedIds}
                        onSelect={handleSelectChapter}
                        onChange={handleChaptersChange}
                        onContextMenu={handleContextMenu}
                        expanded={expandedChapters}
                        onToggle={handleToggleExpand}
                        onRename={handleRename}
                    />
                </div>
                
                {/* Left Resizer */}
                {leftSidebarVisible && (
                    <div
                        className="w-1 hover:bg-blue-500/50 transition-colors z-50 cursor-col-resize select-none shrink-0"
                        onMouseDown={(e) => { e.preventDefault(); setIsResizingLeft(true); }}
                    />
                )}

                {/* Editors Area (Keep Alive) */}
                <div className={`flex-1 overflow-y-auto relative ${darkMode ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
                    {currentChapterId ? (
                        <>
                            {/* Loading Indicator */}
                            {isLoadingContent && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50 z-10">
                                    Loading...
                                </div>
                            )}

                            {/* Render all open editors, hide inactive ones */}
                            {Array.from(openChapters).map(chapterId => {
                                const content = loadedContents[chapterId];
                                const chapter = findChapter(chapters, chapterId);
                                if (!content) {
                                    return chapterId === currentChapterId ? (
                                        <div key={chapterId} className="flex items-center justify-center h-full text-gray-400">
                                            Loading...
                                        </div>
                                    ) : null;
                                }
                                return (
                                    <ChapterEditorWrapper 
                                        key={chapterId}
                                        chapterId={chapterId}
                                        isActive={chapterId === currentChapterId}
                                        focusMode={focusMode}
                                        initialContent={content}
                                        currentBookPath={currentBook.path}
                                        chapterTitle={chapter ? chapter.title : ''}
                                        setOutline={setOutline}
                                        setLastSaved={setLastSaved}
                                        editorRefs={editorRefs}
                                        handleRename={handleRename}
                                        onStatsUpdate={handleStatsUpdate}
                                        currentChapterId={currentChapterId} // pass this to check if outline update needed
                                        outline={outline} // pass outline for diff check
                                        darkMode={darkMode}
                                        spellCheckEnabled={spellCheckEnabled}
                                        onSpellCheckErrors={(errors) => handleSpellCheckErrors(chapterId, errors)}
                                    />
                                );
                            })}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <FileText size={48} className="mb-4 opacity-20" />
                            <p>选择或新建章节开始写作</p>
                        </div>
                    )}
                </div>

                {/* Right Resizer */}
                {rightSidebarVisible && (
                    <div
                        className="w-1 hover:bg-blue-500/50 transition-colors z-50 cursor-col-resize select-none shrink-0"
                        onMouseDown={(e) => { e.preventDefault(); setIsResizingRight(true); }}
                    />
                )}

                {/* Right Sidebar (Outline / SpellCheck) */}
                <div
                    className={`
                        border-l flex flex-col shrink-0 transition-all duration-300 ease-in-out
                        ${rightSidebarVisible ? 'opacity-100 translate-x-0' : 'w-0 opacity-0 translate-x-full overflow-hidden'}
                        ${darkMode ? 'border-gray-800 bg-gray-900/60 backdrop-blur-md' : 'border-gray-200 bg-white/60 backdrop-blur-md'}
                    `}
                    style={{ width: rightSidebarVisible ? rightSidebarWidth : 0 }}
                >
                    <RightSidebar 
                        outline={outline}
                        spellCheckEnabled={spellCheckEnabled}
                        spellErrors={currentSpellErrors}
                        onJumpToHeading={handleJumpToHeading}
                        onJumpToError={handleJumpToError}
                        darkMode={darkMode}
                    />
                </div>
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <div 
                    id="context-menu-container"
                    className="fixed z-[100] bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 shadow-2xl rounded-xl py-1 px-1 w-48 animate-in fade-in zoom-in-95 duration-200"
                    style={{ top: contextMenu.y, left: contextMenu.x, "borderRadius": "16px" }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {contextMenu.item ? (
                        <div className="flex flex-col gap-0.5">
                            <button
                                className="w-full text-left px-3 py-1 text-sm rounded-lg hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-2 transition-colors"
                                onClick={() => handleCut(contextMenu.item.id)}
                                style={{ "borderRadius": "16px" }}
                            >
                                <Scissors size={12} /> 剪切
                            </button>
                            {(!selectedIds.has(contextMenu.item.id) || selectedIds.size <= 1) && (
                                <button
                                    className="w-full text-left px-3 py-1 text-sm rounded-lg hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-2 transition-colors"
                                    onClick={() => {
                                        setRenameModal({ open: true, itemId: contextMenu.item.id, name: contextMenu.item.title });
                                        setContextMenu(null);
                                    }}
                                    style={{ "borderRadius": "16px" }}
                                >
                                    <Edit2 size={12} /> 重命名
                                </button>
                            )}
                            <button
                                className="w-full text-left px-3 py-1 text-sm rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 flex items-center gap-2 transition-colors"
                                onClick={() => {
                                    handleDelete(contextMenu.item.id);
                                    setContextMenu(null);
                                }}
                                style={{ "borderRadius": "16px" }}
                            >
                                <Trash2 size={12} /> 删除 {selectedIds.size > 1 ? `(${selectedIds.size})` : ''}
                            </button>

                            {contextMenu.item.type === 'folder' && (
                                <>
                                    <div className="h-px bg-gray-200/50 dark:bg-gray-700/50 my-1 mx-2" />
                                    <button
                                        className="w-full text-left px-3 py-1 text-sm rounded-lg hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-2 transition-colors"
                                        onClick={() => {
                                            handleCreateChapterWithDeps(contextMenu.item.id);
                                            setContextMenu(null);
                                        }}
                                        style={{ "borderRadius": "16px" }}
                                    >
                                        <Plus size={12} /> 新建章节
                                    </button>
                                    {clipboard && (
                                        <button
                                            className="w-full text-left px-3 py-1 text-sm rounded-lg hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-2 transition-colors"
                                            onClick={() => handlePaste(contextMenu.item.id)}
                                            style={{ "borderRadius": "16px" }}
                                        >
                                            <Clipboard size={12} /> 粘贴
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-0.5">
                            <button
                                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-2 transition-colors"
                                onClick={() => {
                                    handleCreateFolder();
                                    setContextMenu(null);
                                }}
                            >
                                <FolderPlus size={14} /> 新建文件夹
                            </button>
                            <button
                                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-2 transition-colors"
                                onClick={() => {
                                    handleCreateChapterWithDeps();
                                    setContextMenu(null);
                                }}
                            >
                                <Plus size={14} /> 新建章节
                            </button>
                            {clipboard && (
                                <button
                                    className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-2 transition-colors"
                                    onClick={() => handlePaste(null)}
                                >
                                    <Clipboard size={14} /> 粘贴
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
            {/* Rename Modal */}
            <Modal
                isOpen={renameModal.open}
                onClose={() => setRenameModal({ ...renameModal, open: false })}
                title="重命名"
            >
                <div className="flex flex-col gap-4">
                    <input
                        type="text"
                        value={renameModal.name}
                        onChange={(e) => setRenameModal({ ...renameModal, name: e.target.value })}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleRename(renameModal.itemId, renameModal.name);
                                setRenameModal({ ...renameModal, open: false });
                            }
                        }}
                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setRenameModal({ ...renameModal, open: false })}
                            className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                        >
                            取消
                        </button>
                        <button
                            onClick={() => {
                                handleRename(renameModal.itemId, renameModal.name);
                                setRenameModal({ ...renameModal, open: false });
                            }}
                            className="px-4 py-2 text-sm bg-black text-white hover:bg-gray-800 rounded-lg"
                        >
                            确定
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Word Count Bar */}
            <WordCountBar 
                totalStats={totalStats}
                currentStats={currentStats}
                darkMode={darkMode}
                spellCheckEnabled={spellCheckEnabled}
                onToggleSpellCheck={setSpellCheckEnabled}
            />
        </div>
    );
}

// Optimized Editor Wrapper
const ChapterEditorWrapper = React.memo(({ 
    chapterId, 
    isActive, 
    focusMode, 
    initialContent, 
    currentBookPath,
    chapterTitle,
    setOutline,
    setLastSaved,
    editorRefs,
    handleRename,
    onStatsUpdate,
    currentChapterId,
    outline,
    darkMode,
    spellCheckEnabled,
    onSpellCheckErrors
}) => {
    const saveTimeoutRef = useRef(null);

    const extractOutline = (content) => {
        if (!content) return [];
        return content
            .filter(block => block.type === 'heading')
            .map(block => ({
                id: block.id,
                text: block.content && block.content[0]?.text ? block.content[0].text : '无标题',
                level: block.props.level
            }));
    };
    
    // Initial stats calculation
    useEffect(() => {
        if (initialContent) {
            const stats = BookManager.getWordCount(initialContent);
            onStatsUpdate(chapterId, stats);
        }
    }, [initialContent, chapterId, onStatsUpdate]);

    const handleChange = useCallback((content) => {
         // Auto-Rename Logic
         if (content.length > 0) {
            const firstBlock = content[0];
            if (firstBlock.type === 'heading' && firstBlock.props.level === 1) {
                const newTitle = firstBlock.content?.[0]?.text || '无标题';
                // Use chapterTitle prop for check
                if (chapterTitle !== newTitle) {
                    handleRename(chapterId, newTitle);
                }
            }
        }

        // Update Outline
        if (isActive) {
            const newOutline = extractOutline(content);
            setOutline(prev => {
                if (JSON.stringify(prev) !== JSON.stringify(newOutline)) {
                    return newOutline;
                }
                return prev;
            });
        }

        // Calculate Stats
        const stats = BookManager.getWordCount(content);
        onStatsUpdate(chapterId, stats);

        // Debounced Save
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(async () => {
            await BookManager.saveChapterContent(currentBookPath, chapterId, content);
            setLastSaved(new Date());
        }, 1000);

    }, [chapterId, currentBookPath, chapterTitle, isActive, handleRename, setOutline, setLastSaved, onStatsUpdate]); 
    // Dependencies: 
    // chapterTitle: changes when rename happens. Wrapper re-renders.
    // isActive: changes when switching.
    // handleRename: stable.
    // onStatsUpdate: stable.
    
    const handleUploadFile = useCallback(async (file) => {
        return await BookManager.saveAsset(currentBookPath, file);
    }, [currentBookPath]);

    return (
        <div 
            style={{ display: isActive ? 'block' : 'none' }}
            className={`h-full w-full overflow-hidden relative ${focusMode ? 'py-0' : ''}`}
        >
            <MythEditor 
                initialContent={initialContent}
                onEditorReady={(editor) => editorRefs.current[chapterId] = editor}
                onChange={handleChange}
                lang="zh"
                uploadFile={handleUploadFile}
                darkMode={darkMode}
                spellCheckEnabled={spellCheckEnabled}
                onSpellCheckErrors={onSpellCheckErrors}
            />
        </div>
    );
});


export default EditorPage;
