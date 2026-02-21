import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Plus, Search, MoreHorizontal, 
    Trash2, Edit2, Share2, Network, User, BookOpen, Globe,
    X, Maximize, Minimize, Moon, Sun, Save, Tag, Image as ImageIcon,
    Folder, FolderPlus, MoreVertical, Check, ChevronRight, ChevronDown, Filter,
    GalleryHorizontal, LayoutGrid
} from 'lucide-react';
import { useBook } from '../contexts/BookContext';
import MythEditor from '../components/MythEditor/MythEditor';
import Modal from '../components/UI/Modal';
import BookManager from '../utils/BookManager';

// Mock function for simple ID generation
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

// Character Relationship Graph Component (Enhanced)
const CharacterGraph = ({ characters, onClose, darkMode, initialFocusId = null }) => {
    const [selectedNode, setSelectedNode] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [focusedNodeId, setFocusedNodeId] = useState(initialFocusId);
    
    // Calculate layout and filter
    const { nodes, links } = useMemo(() => {
        let filteredChars = characters;

        // 1. Search Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filteredChars = characters.filter(c => 
                c.name.toLowerCase().includes(query) || 
                c.tags.some(t => t.toLowerCase().includes(query)) ||
                c.relationships.some(r => r.relation.toLowerCase().includes(query))
            );
            
            // If searching by relation, we need to include the target characters too
            // But for simplicity, let's just filter nodes first. 
            // Actually, if a relationship matches, we should probably show both nodes.
            // Let's stick to node filtering for now, plus if relation matches, show the source node.
        }

        // 2. Focus Filter (Single View)
        if (focusedNodeId) {
            // Show the focused node and its direct neighbors
            const focusedChar = characters.find(c => c.id === focusedNodeId);
            if (focusedChar) {
                const neighborIds = new Set();
                neighborIds.add(focusedNodeId);
                
                // Outgoing
                focusedChar.relationships.forEach(r => neighborIds.add(r.targetId));
                
                // Incoming
                characters.forEach(c => {
                    if (c.relationships.some(r => r.targetId === focusedNodeId)) {
                        neighborIds.add(c.id);
                    }
                });
                
                filteredChars = characters.filter(c => neighborIds.has(c.id));
            }
        }

        const n = filteredChars.length;
        // Adjust radius based on count to avoid cramping
        const radius = n < 10 ? 200 : 300;
        const centerX = 400; // SVG center
        const centerY = 300;
        
        const nodes = filteredChars.map((char, i) => {
            const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
            return {
                ...char,
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            };
        });

        const links = [];
        filteredChars.forEach(source => {
            if (source.relationships) {
                source.relationships.forEach(rel => {
                    // Only draw link if target is also in the filtered set
                    const target = nodes.find(n => n.id === rel.targetId);
                    const sourceNode = nodes.find(n => n.id === source.id);
                    
                    // Search filter for links
                    const matchesSearch = !searchQuery || 
                        rel.relation.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (target && target.name.toLowerCase().includes(searchQuery.toLowerCase()));

                    if (target && sourceNode && matchesSearch) {
                        links.push({
                            source: sourceNode,
                            target: target,
                            relation: rel.relation
                        });
                    }
                });
            }
        });

        return { nodes, links };
    }, [characters, searchQuery, focusedNodeId]);

    useEffect(() => {
        if (initialFocusId) {
            const node = characters.find(c => c.id === initialFocusId);
            if (node) setSelectedNode(node);
        }
    }, [initialFocusId, characters]);

    return (
        <div className={`fixed inset-0 z-[60] backdrop-blur-sm flex flex-col animate-in fade-in zoom-in-95 duration-200 ${darkMode ? 'bg-gray-900/95 text-gray-100' : 'bg-white/95 text-gray-900'}`}>
            <div className={`h-16 border-b flex items-center justify-between px-6 ${darkMode ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-white/50'}`}>
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Network className="text-purple-600" />
                        人物关系图谱
                    </h2>
                    {focusedNodeId && (
                        <button 
                            onClick={() => setFocusedNodeId(null)}
                            className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full flex items-center gap-1 hover:bg-purple-200 transition-colors"
                        >
                            查看全部 <X size={12} />
                        </button>
                    )}
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="搜索人物、关系..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`pl-9 pr-4 py-1.5 rounded-full text-sm outline-none border ${
                                darkMode 
                                ? 'bg-gray-800 border-gray-700 focus:border-purple-500' 
                                : 'bg-white border-gray-200 focus:border-purple-500'
                            } w-64 transition-all`}
                        />
                    </div>
                    <button onClick={onClose} className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
                        <X size={24} />
                    </button>
                </div>
            </div>
            
            <div className={`flex-1 overflow-hidden flex items-center justify-center relative ${darkMode ? 'bg-[#1a1a1a]' : 'bg-gray-50'}`}>
                {nodes.length === 0 ? (
                    <div className="text-gray-400 flex flex-col items-center">
                        <Search size={48} className="mb-4 opacity-20" />
                        <p>未找到相关人物或关系</p>
                    </div>
                ) : (
                    <svg width="100%" height="100%" viewBox="0 0 800 600" className="w-full h-full max-w-5xl max-h-[800px]">
                        <defs>
                            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill={darkMode ? "#6B7280" : "#9CA3AF"} />
                            </marker>
                        </defs>
                        
                        {/* Links */}
                        {links.map((link, i) => (
                            <g key={i}>
                                <line 
                                    x1={link.source.x} y1={link.source.y} 
                                    x2={link.target.x} y2={link.target.y} 
                                    stroke={darkMode ? "#374151" : "#E5E7EB"} 
                                    strokeWidth="2"
                                    markerEnd="url(#arrowhead)"
                                />
                                <text 
                                    x={(link.source.x + link.target.x) / 2} 
                                    y={(link.source.y + link.target.y) / 2}
                                    textAnchor="middle"
                                    dy="-5"
                                    fontSize="10"
                                    fill={darkMode ? "#9CA3AF" : "#6B7280"}
                                    className={darkMode ? "bg-gray-900" : "bg-white"}
                                    style={{ paintOrder: 'stroke', stroke: darkMode ? '#1a1a1a' : '#fff', strokeWidth: '4px' }}
                                >
                                    {link.relation}
                                </text>
                            </g>
                        ))}

                        {/* Nodes */}
                        {nodes.map(node => {
                            const avatar = node.images && node.images.length > 0 
                                ? (node.images.find(img => img.type === 'Avatar') || node.images[0]).url 
                                : null;
                            
                            return (
                                <g 
                                    key={node.id} 
                                    onClick={() => setSelectedNode(node)}
                                    className="cursor-pointer hover:opacity-80 transition-opacity"
                                >
                                    {/* Node Circle/Image */}
                                    <defs>
                                        <pattern id={`avatar-${node.id}`} x="0" y="0" width="1" height="1">
                                            <image href={avatar} x="0" y="0" width="40" height="40" preserveAspectRatio="xMidYMid slice" />
                                        </pattern>
                                    </defs>
                                    
                                    <circle 
                                        cx={node.x} cy={node.y} r="20" 
                                        fill={avatar ? `url(#avatar-${node.id})` : (darkMode ? "#374151" : "white")} 
                                        stroke={selectedNode?.id === node.id ? "#9333EA" : (darkMode ? "#4B5563" : "#E5E7EB")} 
                                        strokeWidth={selectedNode?.id === node.id ? "3" : "2"} 
                                    />
                                    
                                    {!avatar && (
                                        <text 
                                            x={node.x} y={node.y} 
                                            dy="5" 
                                            textAnchor="middle" 
                                            fontSize="12" 
                                            fontWeight="bold"
                                            fill={darkMode ? "#E5E7EB" : "#374151"}
                                            style={{ pointerEvents: 'none' }}
                                        >
                                            {node.name.charAt(0)}
                                        </text>
                                    )}

                                    <text 
                                        x={node.x} y={node.y + 35} 
                                        textAnchor="middle" 
                                        fontSize="12" 
                                        fontWeight="500"
                                        fill={darkMode ? "#D1D5DB" : "#1F2937"}
                                    >
                                        {node.name}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                )}

                {/* Selected Node Info */}
                {selectedNode && (
                    <div className={`absolute top-6 right-6 w-64 p-4 rounded-xl shadow-xl border animate-in slide-in-from-right-4 ${
                        darkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-100 text-gray-900'
                    }`}>
                        <h3 className="font-bold text-lg mb-1">{selectedNode.name}</h3>
                        <p className={`text-sm mb-3 line-clamp-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {selectedNode.description || '暂无描述'}
                        </p>
                        <div className="flex flex-wrap gap-1 mb-3">
                            {selectedNode.tags.map(t => (
                                <span key={t} className={`text-xs px-2 py-1 rounded ${
                                    darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                                }`}>#{t}</span>
                            ))}
                        </div>
                        <button 
                            onClick={() => {
                                setFocusedNodeId(selectedNode.id);
                                setSearchQuery(''); // Clear search to show neighbors
                            }}
                            className="w-full py-1.5 text-xs font-medium bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                        >
                            查看详情 & 关系
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// Character Carousel Component (Simplified)
const CharacterCarousel = ({ items, onAdd, onEdit, onDelete, onGraph, setDraggedItem, darkMode }) => {
    return (
        <div className="w-full h-full flex items-center justify-center relative overflow-hidden py-4">
             <div 
                className="flex overflow-x-auto items-center px-[40%] w-full h-full no-scrollbar snap-x snap-mandatory gap-4 relative"
                style={{ scrollbarWidth: 'none' }}
             >
                {/* Add Card */}
                <div 
                    className={`shrink-0 snap-center w-[280px] h-[460px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group backdrop-blur-md ${
                        darkMode 
                        ? 'bg-gray-800/50 border-gray-700 hover:border-purple-500 hover:bg-gray-800' 
                        : 'bg-white/50 border-gray-300 hover:border-purple-500 hover:bg-white'
                    }`}
                    onClick={onAdd}
                >
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors mb-6 ${
                        darkMode ? 'bg-gray-700 group-hover:bg-purple-900/50' : 'bg-gray-100 group-hover:bg-purple-100'
                    }`}>
                        <Plus size={40} className={`transition-colors ${
                            darkMode ? 'text-gray-500 group-hover:text-purple-400' : 'text-gray-400 group-hover:text-purple-600'
                        }`} />
                    </div>
                    <span className={`font-bold text-lg ${
                        darkMode ? 'text-gray-500 group-hover:text-purple-400' : 'text-gray-500 group-hover:text-purple-600'
                    }`}>新建人物</span>
                </div>

                {items.map((item) => {
                     const avatarImg = item.images && item.images.length > 0 
                                    ? (item.images.find(img => img.type === 'Avatar') || item.images[0])
                                    : null;
                     const coverUrl = avatarImg?.url;
                     
                     return (
                        <div 
                            key={item.id}
                            className="shrink-0 snap-center w-[280px] h-[460px] relative rounded-2xl overflow-hidden cursor-pointer shadow-xl bg-black group transition-all duration-300 hover:-translate-y-2"
                            onClick={() => onEdit(item)}
                            draggable
                            onDragStart={() => setDraggedItem(item)}
                        >
                            {/* Background Image */}
                            {coverUrl ? (
                                <img src={coverUrl} alt={item.name} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
                            ) : (
                                <div className={`absolute inset-0 flex items-center justify-center ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                                    <User size={64} className="opacity-20 text-gray-500" />
                                </div>
                            )}
                            
                            {/* Gradient Overlay */}
                            <div className="absolute inset-x-0 bottom-0 h-4/5 bg-gradient-to-t from-black via-black/80 to-transparent opacity-90" />

                            {/* Content */}
                            <div className="absolute inset-0 flex flex-col justify-end p-6 text-white pb-10">
                                <div className="mb-6 w-24 h-24 rounded-full border-2 border-white/30 overflow-hidden shadow-2xl mx-auto shrink-0 bg-gray-900 z-10 relative">
                                    {coverUrl ? (
                                        <img src={coverUrl} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <User size={40} className="text-white/50" />
                                        </div>
                                    )}
                                </div>

                                <div className="text-center relative z-10 transform transition-transform duration-300 group-hover:-translate-y-2">
                                    <h3 className="font-bold text-2xl leading-tight mb-2 drop-shadow-lg">{item.name || '无标题'}</h3>
                                    
                                    <p className="text-white/70 text-sm line-clamp-3 mb-3 leading-relaxed px-2">
                                        {item.description || '暂无描述...'}
                                    </p>
                                    
                                    <div className="flex flex-wrap gap-1.5 justify-center">
                                        {item.tags && item.tags.slice(0, 3).map((tag, idx) => (
                                            <span key={idx} className="text-xs px-2 py-0.5 bg-white/10 text-white/90 rounded-full backdrop-blur-md border border-white/10">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Hover Actions */}
                                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                                    <button 
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            onGraph(item.id);
                                        }}
                                        className="p-2 bg-black/40 hover:bg-purple-600 text-white rounded-full backdrop-blur-md transition-colors shadow-lg"
                                        title="查看关系"
                                    >
                                        <Network size={18} />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onDelete(item.id, 'character'); }}
                                        className="p-2 bg-black/40 hover:bg-red-600 text-white rounded-full backdrop-blur-md transition-colors shadow-lg"
                                        title="删除"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                     )
                })}
             </div>
        </div>
    );
};

// Categorized Grid Component
const CategorizedGrid = ({ 
    items, categories, activeTab, 
    onAdd, onEdit, onDelete, 
    draggedItem, setDraggedItem, 
    dragOverTarget, setDragOverTarget, handleDragOverCard,
    handleDropCategory, handleReorder,
    darkMode, selectedCategory
}) => {
    // Group items by category
    const uncategorizedItems = items.filter(item => !item.categoryId);
    const categorizedGroups = categories.map(cat => ({
        ...cat,
        items: items.filter(item => item.categoryId === cat.id)
    }));

    const renderCard = (item) => {
        const avatarImg = item.images && item.images.length > 0 
            ? (item.images.find(img => img.type === 'Avatar') || item.images[0])
            : null;
        const coverUrl = avatarImg?.url;
        const isCharacter = activeTab === 'character';

        const Placeholder = () => (
            <div className={`rounded-xl border-2 border-dashed transition-all duration-300 animate-in fade-in zoom-in-95 ${
                isCharacter ? 'h-[360px]' : 'h-[240px]'
            } ${darkMode ? 'border-gray-700 bg-gray-800/30' : 'border-purple-300 bg-purple-50/50'}`}></div>
        );

        return (
            <React.Fragment key={item.id}>
                {dragOverTarget?.id === item.id && dragOverTarget.position === 'before' && <Placeholder />}
                
                <div 
                    draggable
                    onDragStart={() => setDraggedItem(item)}
                    onDragEnd={() => { setDraggedItem(null); setDragOverTarget(null); }}
                    onDragOver={(e) => handleDragOverCard(e, item)}
                    onDrop={(e) => handleReorder(e, item, item.categoryId || '')}
                    className={`relative rounded-xl overflow-hidden cursor-pointer group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                        isCharacter ? 'h-[360px]' : 'h-[240px]'
                    } ${draggedItem?.id === item.id ? 'opacity-50' : ''}`}
                    onClick={() => onEdit(item)}
                >
                {/* Background Image */}
                {coverUrl ? (
                    <img src={coverUrl} alt={item.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                    <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-400">
                        <ImageIcon size={48} className="opacity-20" />
                    </div>
                )}
                
                {/* Gradient Overlay */}
                <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black via-black/60 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-4 text-white transform transition-transform duration-300 group-hover:-translate-y-2">
                    {/* Character Avatar */}
                    {isCharacter && (
                        <div className="mb-3 w-20 h-20 rounded-full border-2 border-white/30 overflow-hidden shadow-lg mx-auto shrink-0 bg-gray-800">
                            {coverUrl ? (
                                <img src={coverUrl} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <User size={32} className="text-white/50" />
                                </div>
                            )}
                        </div>
                    )}

                    <div className={`${isCharacter ? 'text-center' : ''}`}>
                        <h3 className="font-bold text-lg leading-tight mb-1 drop-shadow-md">{item.name || '无标题'}</h3>
                        
                        <p className="text-white/70 text-xs line-clamp-2 mb-2 leading-relaxed h-8">
                            {item.description || '暂无描述...'}
                        </p>
                        
                        <div className={`flex flex-wrap gap-1 ${isCharacter ? 'justify-center' : ''}`}>
                            {item.tags && item.tags.slice(0, 2).map((tag, idx) => (
                                <span key={idx} className="text-[10px] px-1.5 py-0.5 bg-white/20 text-white/90 rounded backdrop-blur-sm border border-white/10">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Hover Actions */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300 z-10">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(item.id, activeTab); }}
                            className="p-1.5 bg-black/40 hover:bg-red-600 text-white rounded-full backdrop-blur-md transition-colors"
                            title="删除"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            </div>
            {dragOverTarget?.id === item.id && dragOverTarget.position === 'after' && <Placeholder />}
        </React.Fragment>
    );
};

    const gridClasses = activeTab === 'character' 
        ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" 
        : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

    // If a specific category is selected, just show its items in a grid without headers
    if (selectedCategory) {
        return (
            <div className="space-y-8 pb-10">
                 {/* New Card Button */}
                <div 
                    onClick={onAdd}
                    className={`w-full py-3 rounded-lg border border-dashed flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        darkMode 
                        ? 'border-gray-700 bg-gray-800/50 hover:bg-gray-800 text-gray-400 hover:text-purple-400 hover:border-purple-500' 
                        : 'border-gray-300 bg-white/50 hover:bg-white text-gray-500 hover:text-purple-600 hover:border-purple-400'
                    }`}
                >
                    <Plus size={16} />
                    <span className="text-sm font-medium">新建卡片</span>
                </div>

                <div 
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDropCategory(e, selectedCategory)}
                    className={`rounded-xl p-4 transition-colors ${draggedItem && draggedItem.categoryId !== selectedCategory ? (darkMode ? 'bg-gray-800/50 border border-dashed border-gray-700' : 'bg-purple-50/50 border border-dashed border-purple-200') : ''}`}
                >
                     <div className={`grid gap-4 ${gridClasses}`}>
                        {items.map(renderCard)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            {/* New Card Button (Full Width Slim) */}
            <div 
                onClick={onAdd}
                className={`w-full py-3 rounded-lg border border-dashed flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    darkMode 
                    ? 'border-gray-700 bg-gray-800/50 hover:bg-gray-800 text-gray-400 hover:text-purple-400 hover:border-purple-500' 
                    : 'border-gray-300 bg-white/50 hover:bg-white text-gray-500 hover:text-purple-600 hover:border-purple-400'
                }`}
            >
                <Plus size={16} />
                <span className="text-sm font-medium">新建卡片</span>
            </div>

            {/* Categorized Groups */}
            {categorizedGroups.map(group => (
                <div 
                    key={group.id}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDropCategory(e, group.id)}
                    className={`rounded-xl p-4 transition-colors ${draggedItem && draggedItem.categoryId !== group.id ? (darkMode ? 'bg-gray-800/50 border border-dashed border-gray-700' : 'bg-purple-50/50 border border-dashed border-purple-200') : ''}`}
                >
                    <h3 className={`font-bold text-sm mb-4 flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <Folder size={16} />
                        {group.name}
                        <span className={`text-xs px-1.5 py-0.5 rounded ${darkMode ? 'bg-gray-800 text-gray-500' : 'bg-gray-200 text-gray-500'}`}>{group.items.length}</span>
                    </h3>
                    <div className={`grid gap-4 ${gridClasses}`}>
                        {group.items.map(renderCard)}
                    </div>
                </div>
            ))}

            {/* Uncategorized */}
            {(uncategorizedItems.length > 0 || categorizedGroups.length > 0) && (
                <div 
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDropCategory(e, '')}
                    className={`rounded-xl p-4 transition-colors ${
                        draggedItem && draggedItem.categoryId 
                        ? (darkMode ? 'bg-gray-800/50 border border-dashed border-gray-700' : 'bg-purple-50/50 border border-dashed border-purple-200') 
                        : ''
                    } ${
                        uncategorizedItems.length === 0 && !draggedItem
                        ? 'border-0' 
                        : (uncategorizedItems.length === 0 ? 'border-2 border-dashed border-gray-200 min-h-[100px] flex items-center justify-center' : '')
                    }`}
                >
                    {uncategorizedItems.length > 0 ? (
                        <>
                            <h3 className={`font-bold text-sm mb-4 flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                <FolderPlus size={16} />
                                未分类
                                <span className={`text-xs px-1.5 py-0.5 rounded ${darkMode ? 'bg-gray-800 text-gray-500' : 'bg-gray-200 text-gray-500'}`}>{uncategorizedItems.length}</span>
                            </h3>
                            <div className={`grid gap-4 ${gridClasses}`}>
                                {uncategorizedItems.map(renderCard)}
                            </div>
                        </>
                    ) : (
                         draggedItem && (
                             <div className="text-gray-400 text-sm flex items-center gap-2">
                                <FolderPlus size={16} />
                                <span>拖拽至此移出分类</span>
                             </div>
                         )
                    )}
                </div>
            )}
        </div>
    );
};

const SettingsPage = () => {
    const navigate = useNavigate();
    const { currentBook, currentBookData, saveBookData } = useBook();
    
    // Tab State: 'worldview', 'story', 'character'
    const [activeTab, setActiveTab] = useState('worldview');
    const [searchQuery, setSearchQuery] = useState('');
    const [showGraph, setShowGraph] = useState(false);
    const [graphFocusId, setGraphFocusId] = useState(null);
    
    // Data State
    const [settingsData, setSettingsData] = useState({
        worldViews: [],
        stories: [],
        characters: [],
        categories: { worldview: [], story: [], character: [] }
    });
    
    const [selectedCategory, setSelectedCategory] = useState(null); // null = All
    const [editingCategory, setEditingCategory] = useState(null); // For renaming
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [editForm, setEditForm] = useState({
        name: '',
        description: '',
        categoryId: '',
        tags: [],
        content: [],
        relationships: [],
        images: [],
        relatedCharacters: []
    });

    // UI State
    const [focusMode, setFocusMode] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [newTag, setNewTag] = useState('');

    const [draggedItem, setDraggedItem] = useState(null);
    const [dragOverTarget, setDragOverTarget] = useState(null);
    const [viewMode, setViewMode] = useState(() => localStorage.getItem('myth_character_view_mode') || 'carousel');

    useEffect(() => {
        localStorage.setItem('myth_character_view_mode', viewMode);
    }, [viewMode]);

    // Load data
    useEffect(() => {
        if (currentBookData?.settings) {
            const normalize = (items) => {
                if (!Array.isArray(items)) return [];
                return items.map(item => {
                    const base = typeof item === 'string' ? { name: item, id: generateId() } : item;
                    return {
                        id: base.id || generateId(),
                        name: base.name || '',
                        description: base.description || '',
                        categoryId: base.categoryId || '',
                        tags: base.tags || [],
                        content: base.content || [],
                        createdAt: base.createdAt || new Date().toISOString(),
                        updatedAt: base.updatedAt || new Date().toISOString(),
                        relationships: base.relationships || [],
                        images: base.images || [],
                        relatedCharacters: base.relatedCharacters || []
                    };
                });
            };

            const cats = currentBookData.settings.categories || { worldview: [], story: [], character: [] };

            setSettingsData({
                worldViews: normalize(currentBookData.settings.worldViews),
                stories: normalize(currentBookData.settings.stories),
                characters: normalize(currentBookData.settings.characters),
                categories: {
                    worldview: cats.worldview || [],
                    story: cats.story || [],
                    character: cats.character || []
                }
            });
        }
    }, [currentBookData]);

    // Save Helper
    const saveSettings = async (newSettingsData) => {
        setSettingsData(newSettingsData);
        await saveBookData('settings', newSettingsData);
    };

    // --- Category Management ---
    const handleAddCategory = () => {
        setNewCategoryName('');
        setIsCategoryModalOpen(true);
    };

    const handleConfirmAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        
        const newCat = { id: generateId(), name: newCategoryName.trim() };
        const newCategories = {
            ...settingsData.categories,
            [activeTab]: [...settingsData.categories[activeTab], newCat]
        };
        
        await saveSettings({ ...settingsData, categories: newCategories });
        
        // If editing, auto-select the new category
        if (isEditModalOpen) {
            setEditForm(prev => ({ ...prev, categoryId: newCat.id }));
        }
        
        setIsCategoryModalOpen(false);
    };

    const handleDeleteCategory = async (catId) => {
        if (!window.confirm("确定删除该分类吗？分类下的条目将变为未分类。")) return;
        
        const newCategories = {
            ...settingsData.categories,
            [activeTab]: settingsData.categories[activeTab].filter(c => c.id !== catId)
        };

        // Reset items categoryId
        const key = activeTab === 'worldview' ? 'worldViews' : (activeTab === 'story' ? 'stories' : 'characters');
        const newItems = settingsData[key].map(item => 
            item.categoryId === catId ? { ...item, categoryId: '' } : item
        );

        await saveSettings({ 
            ...settingsData, 
            categories: newCategories,
            [key]: newItems
        });
        
        if (selectedCategory === catId) setSelectedCategory(null);
    };

    const handleDropCategory = async (e, catId) => {
        e.preventDefault();
        e.stopPropagation(); // Stop propagation
        if (!draggedItem) return;

        const key = activeTab === 'worldview' ? 'worldViews' : (activeTab === 'story' ? 'stories' : 'characters');
        const currentItems = [...settingsData[key]];
        
        // Find current index and dragged item
        const draggedIndex = currentItems.findIndex(i => i.id === draggedItem.id);
        if (draggedIndex === -1) return;

        // Remove from old position
        const [item] = currentItems.splice(draggedIndex, 1);
        item.categoryId = catId;
        
        // Append to end of list (so it appears last in the category)
        currentItems.push(item);

        await saveSettings({ 
            ...settingsData, 
            [key]: currentItems
        });
        
        setDraggedItem(null);
        setDragOverTarget(null);
    };

    // Reordering within the same category
    const handleDragOverCard = (e, item) => {
        e.preventDefault();
        e.stopPropagation();
        if (!draggedItem || draggedItem.id === item.id) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const midX = rect.left + rect.width / 2;
        const midY = rect.top + rect.height / 2;
        
        // Use X axis for grid layout primarily, but maybe fallback to Y if stacked?
        // Actually, simple X split works well for grid items usually.
        // Let's use both. If same row, use X. If different row, use Y?
        // Simple approach: just use X for now as items are flowed left-to-right.
        const position = e.clientX < midX ? 'before' : 'after';
        
        if (!dragOverTarget || dragOverTarget.id !== item.id || dragOverTarget.position !== position) {
            setDragOverTarget({ id: item.id, position });
        }
    };

    const handleReorder = async (e, targetItem, catId) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!draggedItem || draggedItem.id === targetItem.id) return;
        
        const key = activeTab === 'worldview' ? 'worldViews' : (activeTab === 'story' ? 'stories' : 'characters');
        let newItems = [...settingsData[key]];
        
        const draggedIndex = newItems.findIndex(i => i.id === draggedItem.id);
        const targetIndex = newItems.findIndex(i => i.id === targetItem.id);
        
        if (draggedIndex === -1 || targetIndex === -1) return;

        // Remove dragged item
        const [movedItem] = newItems.splice(draggedIndex, 1);
        
        // Update category if target is in a different category
        movedItem.categoryId = targetItem.categoryId;
        
        // Insert at new position
        let newTargetIndex = newItems.findIndex(i => i.id === targetItem.id);
        
        let insertIndex = newTargetIndex;
        if (dragOverTarget && dragOverTarget.id === targetItem.id) {
            if (dragOverTarget.position === 'after') {
                insertIndex++;
            }
        } else {
             // Fallback logic
             if (draggedIndex < targetIndex) {
                 insertIndex++;
             }
        }
        
        newItems.splice(insertIndex, 0, movedItem);
        
        await saveSettings({
            ...settingsData,
            [key]: newItems
        });
        
        setDraggedItem(null);
        setDragOverTarget(null);
    };

    // --- Item Management ---
    const handleAddItem = () => {
        const newItem = {
            id: generateId(),
            content: [{ type: "paragraph", content: "在此输入详细设定..." }],
        };
        setEditingItem(null);
        setEditForm({
            name: '',
            description: '',
            categoryId: selectedCategory || '',
            tags: [],
            content: newItem.content,
            relationships: [],
            images: [],
            relatedCharacters: []
        });
        setNewTag('');
        setIsEditModalOpen(true);
    };

    const handleEditItem = (item) => {
        setEditingItem(item);
        setEditForm({
            name: item.name,
            description: item.description || '',
            categoryId: item.categoryId || '',
            tags: item.tags || [],
            content: item.content || [],
            relationships: item.relationships || [],
            images: item.images || [],
            relatedCharacters: item.relatedCharacters || []
        });
        setNewTag('');
        setIsEditModalOpen(true);
    };

    const handleDeleteItem = async (id, type) => {
        if (!window.confirm('确定要删除吗？此操作不可恢复。')) return;
        
        const key = type === 'worldview' ? 'worldViews' : (type === 'story' ? 'stories' : 'characters');
        const newItems = settingsData[key].filter(item => item.id !== id);
        
        // Relationship cleanup logic remains same...
        let newCharacters = settingsData.characters;
        let newStories = settingsData.stories;

        if (type === 'character') {
            newCharacters = newCharacters.map(char => ({
                ...char,
                relationships: char.relationships.filter(rel => rel.targetId !== id)
            })).filter(char => char.id !== id);

            newStories = newStories.map(story => ({
                ...story,
                relatedCharacters: story.relatedCharacters.filter(rc => rc.characterId !== id)
            }));
        }

        const newSettings = { 
            ...settingsData, 
            [key]: newItems,
            characters: type === 'character' ? newCharacters : settingsData.characters,
            stories: type === 'character' ? newStories : settingsData.stories
        };
        
        await saveSettings(newSettings);
    };

    const handleSaveEdit = async () => {
        if (!editForm.name.trim()) {
            alert('请输入名称');
            return;
        }

        const key = activeTab === 'worldview' ? 'worldViews' : (activeTab === 'story' ? 'stories' : 'characters');
        const items = settingsData[key];
        
        const newItemData = {
            ...editForm,
            updatedAt: new Date().toISOString()
        };

        let newItems;
        if (editingItem) {
            newItems = items.map(item => item.id === editingItem.id ? { ...item, ...newItemData } : item);
        } else {
            newItems = [...items, {
                id: generateId(),
                createdAt: new Date().toISOString(),
                ...newItemData
            }];
        }

        const newSettings = { ...settingsData, [key]: newItems };
        await saveSettings(newSettings);
        setIsEditModalOpen(false);
    };

    const handleAddTag = (e) => {
        if (e.key === 'Enter' && newTag.trim()) {
            e.preventDefault();
            if (!editForm.tags.includes(newTag.trim())) {
                setEditForm({ ...editForm, tags: [...editForm.tags, newTag.trim()] });
            }
            setNewTag('');
        }
    };

    const removeTag = (tag) => {
        setEditForm({ ...editForm, tags: editForm.tags.filter(t => t !== tag) });
    };

    const handleUploadFile = useCallback(async (file) => {
        if (!currentBook?.path) return null;
        try {
            return await BookManager.saveAsset(currentBook.path, file);
        } catch (error) {
            console.error("Upload failed", error);
            return null;
        }
    }, [currentBook]);

    const getFilteredItems = () => {
        const key = activeTab === 'worldview' ? 'worldViews' : (activeTab === 'story' ? 'stories' : 'characters');
        const items = settingsData[key] || [];
        
        return items.filter(item => {
            const matchesSearch = !searchQuery || 
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
            
            const matchesCategory = !selectedCategory || item.categoryId === selectedCategory;
            
            return matchesSearch && matchesCategory;
        });
    };

    const items = getFilteredItems();
    
    // UI Helpers
    const TabIcons = { worldview: Globe, story: BookOpen, character: User };
    const ActiveIcon = TabIcons[activeTab];
    const currentCategories = settingsData.categories[activeTab] || [];

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col">
            {/* Header */}
            <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <div className="flex items-center gap-2">
                         <h1 className="text-lg font-bold">设定集</h1>
                         <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            {currentBook?.title}
                        </span>
                    </div>
                   
                    {/* Tabs */}
                    <div className="flex gap-2 ml-4">
                        {[
                            { id: 'worldview', label: '世界观' },
                            { id: 'story', label: '故事' },
                            { id: 'character', label: '人物' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setSelectedCategory(null); }}
                                className={`px-4 py-2 text-sm font-medium rounded-[16px] transition-all flex items-center gap-2 border backdrop-blur-sm ${
                                    activeTab === tab.id 
                                    ? 'bg-purple-100/50 border-purple-200 text-purple-700' 
                                    : 'bg-transparent border-transparent text-gray-500 hover:bg-gray-100/50'
                                }`}
                            >
                                {React.createElement(TabIcons[tab.id], { size: 14 })}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                     <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="搜索..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-1.5 bg-gray-100 border-none rounded-full text-sm focus:ring-2 focus:ring-purple-500/20 w-56 transition-all"
                        />
                    </div>
                    {activeTab === 'character' && (
                        <div className="flex bg-gray-100 rounded-lg p-0.5 border border-gray-200">
                             <button
                                onClick={() => setViewMode('carousel')}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                                    viewMode === 'carousel' 
                                    ? 'bg-white text-purple-600 shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <GalleryHorizontal size={14} /> 滚动
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                                    viewMode === 'grid' 
                                    ? 'bg-white text-purple-600 shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <LayoutGrid size={14} /> 网格
                            </button>
                        </div>
                    )}
                    {activeTab === 'character' && (
                        <button
                            onClick={() => { setGraphFocusId(null); setShowGraph(true); }}
                            className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 transition-all flex items-center gap-2"
                        >
                            <Network size={14} /> 关系图
                        </button>
                    )}
                    <button 
                        onClick={handleAddItem}
                        className="bg-purple-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center gap-2 shadow-sm shadow-purple-200"
                    >
                        <Plus size={16} /> 新建
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar (Categories) */}
                <div className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
                    <div className="p-4 flex items-center justify-between border-b border-gray-100">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">分类目录</span>
                        <button 
                            onClick={handleAddCategory}
                            className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-purple-600 transition-colors"
                            title="添加分类"
                        >
                            <FolderPlus size={16} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDropCategory(e, '')}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                                selectedCategory === null 
                                ? 'bg-purple-50 text-purple-700 font-medium' 
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <Folder size={16} className={selectedCategory === null ? 'fill-purple-200 text-purple-600' : 'text-gray-400'} />
                            全部内容
                            <span className="ml-auto text-xs text-gray-400 bg-white px-1.5 py-0.5 rounded border border-gray-100">
                                {settingsData[activeTab === 'worldview' ? 'worldViews' : (activeTab === 'story' ? 'stories' : 'characters')].length}
                            </span>
                        </button>
                        
                        {currentCategories.map(cat => (
                            <div key={cat.id} className="group relative">
                                <button
                                    onClick={() => setSelectedCategory(cat.id)}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => handleDropCategory(e, cat.id)}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                                        selectedCategory === cat.id
                                        ? 'bg-purple-50 text-purple-700 font-medium' 
                                        : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    <Folder size={16} className={selectedCategory === cat.id ? 'fill-purple-200 text-purple-600' : 'text-gray-400'} />
                                    {cat.name}
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <ActiveIcon size={48} className="mb-4 opacity-10" />
                            <p>暂无内容</p>
                            <button 
                                onClick={handleAddItem}
                                className="mt-4 text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center gap-1"
                            >
                                <Plus size={14} /> 新建卡片
                            </button>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'character' && viewMode === 'carousel' ? (
                                <CharacterCarousel 
                                    items={items} 
                                    onAdd={handleAddItem}
                                    onEdit={handleEditItem}
                                    onDelete={handleDeleteItem}
                                    onGraph={(id) => { setGraphFocusId(id); setShowGraph(true); }}
                                    setDraggedItem={setDraggedItem}
                                    darkMode={darkMode}
                                />
                            ) : (
                                <CategorizedGrid 
                                    items={items}
                                    categories={currentCategories}
                                    activeTab={activeTab}
                                    onAdd={handleAddItem}
                                    onEdit={handleEditItem}
                                    onDelete={handleDeleteItem}
                                    draggedItem={draggedItem}
                                    setDraggedItem={setDraggedItem}
                                    dragOverTarget={dragOverTarget}
                                    setDragOverTarget={setDragOverTarget}
                                    handleDragOverCard={handleDragOverCard}
                                    handleDropCategory={handleDropCategory}
                                    handleReorder={handleReorder}
                                    darkMode={darkMode}
                                    selectedCategory={selectedCategory}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className={`fixed inset-0 z-[100] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200 ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}>
                    {/* Modal Header */}
                    {!focusMode && (
                        <div className={`h-14 border-b flex items-center justify-between px-6 shrink-0 ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                            <div className="flex items-center gap-4">
                                <button onClick={() => setIsEditModalOpen(false)} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
                                    <ArrowLeft size={20} />
                                </button>
                                <span className="font-bold text-lg">
                                    {editingItem ? '编辑' : '新建'}
                                    {activeTab === 'worldview' ? '世界观' : (activeTab === 'story' ? '故事' : '人物')}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setFocusMode(true)} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-100' : 'hover:bg-gray-100 text-gray-500 hover:text-black'}`} title="专注模式">
                                    <Maximize size={20} />
                                </button>
                                <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-800 text-yellow-400' : 'hover:bg-gray-100 text-gray-500'}`} title="切换主题">
                                    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                                </button>
                                <div className={`h-6 w-px mx-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                                <button onClick={handleSaveEdit} className={`px-6 py-2 rounded-[16px] text-sm font-medium transition-colors flex items-center gap-2 border backdrop-blur-sm ${darkMode ? 'bg-purple-500/10 text-purple-300 border-purple-500/30 hover:bg-purple-500/20' : 'bg-purple-100/80 text-purple-700 border-purple-200 hover:bg-purple-200/80'}`}>
                                    <Save size={16} /> 保存
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Modal Content */}
                    <div className="flex-1 flex overflow-hidden">
                        {focusMode && (
                            <button onClick={() => setFocusMode(false)} className="absolute top-4 right-4 z-50 p-2 bg-black/10 hover:bg-black/20 rounded-full text-gray-500 hover:text-black">
                                <Minimize size={20} />
                            </button>
                        )}

                        {/* Left Form */}
                        <div className={`
                            w-80 border-r overflow-y-auto shrink-0 transition-all duration-300
                            ${focusMode ? 'w-0 opacity-0 overflow-hidden border-none' : 'opacity-100'}
                            ${darkMode ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}
                        `}>
                            <div className="p-6 space-y-6">
                                <div>
                                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>基本信息</label>
                                    <div className="space-y-4">
                                        <input 
                                            type="text" 
                                            value={editForm.name}
                                            onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                            className={`w-full px-3 py-2 border rounded-lg outline-none transition-all ${
                                                darkMode ? 'bg-gray-800 border-gray-700 text-white focus:border-purple-500' : 'bg-white border-gray-300 text-black focus:border-purple-500'
                                            }`}
                                            placeholder="名称"
                                        />
                                        <div className="flex gap-2 items-center">
                                            <select
                                                value={editForm.categoryId}
                                                onChange={(e) => setEditForm({...editForm, categoryId: e.target.value})}
                                                className={`flex-1 px-3 py-2 border rounded-lg outline-none transition-all ${
                                                    darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-black'
                                                }`}
                                            >
                                                <option value="">无分类</option>
                                                {currentCategories.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={handleAddCategory}
                                                className={`p-2 rounded-lg border transition-colors ${
                                                    darkMode ? 'border-gray-700 hover:bg-gray-800 text-gray-400' : 'border-gray-300 hover:bg-gray-50 text-gray-500'
                                                }`}
                                                title="新建分类"
                                            >
                                                <Plus size={20} />
                                            </button>
                                        </div>
                                        <textarea 
                                            value={editForm.description}
                                            onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                                            className={`w-full px-3 py-2 border rounded-lg outline-none transition-all h-24 resize-none ${
                                                darkMode ? 'bg-gray-800 border-gray-700 text-white focus:border-purple-500' : 'bg-white border-gray-300 text-black focus:border-purple-500'
                                            }`}
                                            placeholder="简短描述..."
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>标签</label>
                                    <div className={`w-full px-3 py-2 border rounded-lg min-h-[42px] flex flex-wrap gap-2 transition-all ${
                                            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                                        }`}>
                                        {editForm.tags.map((tag, idx) => (
                                            <span key={idx} className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
                                                darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                                #{tag}
                                                <button onClick={() => removeTag(tag)} className="hover:text-red-500"><X size={12} /></button>
                                            </span>
                                        ))}
                                        <input 
                                            type="text" 
                                            value={newTag}
                                            onChange={(e) => setNewTag(e.target.value)}
                                            onKeyDown={handleAddTag}
                                            className="bg-transparent outline-none text-sm flex-1 min-w-[60px]"
                                            placeholder={editForm.tags.length === 0 ? "输入标签..." : ""}
                                        />
                                    </div>
                                </div>

                                {/* Images (All Types) */}
                                <div>
                                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>图鉴 / 封面</label>
                                    <div className="space-y-3 mb-3">
                                        {editForm.images.map((img, idx) => (
                                            <div key={img.id || idx} className={`p-2 rounded border flex gap-3 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                                <div className="w-16 h-16 shrink-0 bg-gray-100 rounded overflow-hidden border border-gray-200 relative">
                                                    <img src={img.url} alt="preview" className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1 flex flex-col gap-2">
                                                    <div className="flex gap-1">
                                                        <select
                                                            value={img.type || 'Concept'}
                                                            onChange={(e) => {
                                                                const newImages = [...editForm.images];
                                                                newImages[idx] = { ...newImages[idx], type: e.target.value };
                                                                setEditForm({ ...editForm, images: newImages });
                                                            }}
                                                            className={`text-xs border rounded p-1 flex-1 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                                        >
                                                            <option value="Avatar">头像/封面</option>
                                                            <option value="Concept">设定</option>
                                                            <option value="Design">设计</option>
                                                            <option value="Other">其他</option>
                                                        </select>
                                                        <button
                                                            onClick={() => {
                                                                const newImages = [...editForm.images];
                                                                newImages.splice(idx, 1);
                                                                setEditForm({ ...editForm, images: newImages });
                                                            }}
                                                            className="p-1 text-gray-400 hover:text-red-500 rounded"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={img.description || ''}
                                                        onChange={(e) => {
                                                            const newImages = [...editForm.images];
                                                            newImages[idx] = { ...newImages[idx], description: e.target.value };
                                                            setEditForm({ ...editForm, images: newImages });
                                                        }}
                                                        placeholder="描述..."
                                                        className={`text-xs px-2 py-1 border rounded outline-none w-full ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <label className={`cursor-pointer flex items-center justify-center gap-2 w-full py-2 border border-dashed rounded-lg text-sm transition-colors ${
                                        darkMode ? 'border-gray-700 text-gray-400 hover:text-gray-200' : 'border-gray-300 text-gray-500 hover:text-purple-600 hover:bg-purple-50'
                                    }`}>
                                        <input 
                                            type="file" multiple accept="image/*" className="hidden" 
                                            onChange={async (e) => {
                                                const files = Array.from(e.target.files);
                                                if (!files.length) return;
                                                const newImages = [...editForm.images];
                                                for (const file of files) {
                                                    const url = await handleUploadFile(file);
                                                    if (url) newImages.push({ id: generateId(), url: url, type: 'Concept', description: '' });
                                                }
                                                setEditForm({ ...editForm, images: newImages });
                                                e.target.value = '';
                                            }} 
                                        />
                                        <Plus size={16} /> 添加图片
                                    </label>
                                </div>

                                {/* Relationships (Character Only) */}
                                {activeTab === 'character' && (
                                    <div>
                                        <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>关系</label>
                                        <div className="space-y-2 mb-2">
                                            {editForm.relationships.map((rel, idx) => {
                                                const target = settingsData.characters.find(c => c.id === rel.targetId);
                                                return (
                                                    <div key={idx} className={`flex items-center gap-2 text-sm p-2 rounded border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                                        <span className="font-medium">{target?.name || '未知'}</span>
                                                        <span className="text-gray-400 text-xs">是</span>
                                                        <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>{rel.relation}</span>
                                                        <button 
                                                            onClick={() => {
                                                                const newRels = [...editForm.relationships];
                                                                newRels.splice(idx, 1);
                                                                setEditForm({...editForm, relationships: newRels});
                                                            }}
                                                            className="ml-auto text-gray-400 hover:text-red-500"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="flex gap-2">
                                            <select 
                                                id="rel-target"
                                                className={`flex-1 text-sm border rounded p-1 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-300'}`}
                                            >
                                                <option value="">选择人物</option>
                                                {settingsData.characters.filter(c => c.id !== (editingItem?.id)).map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                            <input id="rel-desc" type="text" placeholder="关系" className={`w-20 text-sm border rounded p-1 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-300'}`} />
                                            <button 
                                                onClick={() => {
                                                    const targetId = document.getElementById('rel-target').value;
                                                    const relation = document.getElementById('rel-desc').value;
                                                    if (targetId && relation) {
                                                        setEditForm({ ...editForm, relationships: [...editForm.relationships, { targetId, relation }] });
                                                        document.getElementById('rel-desc').value = '';
                                                        document.getElementById('rel-target').value = '';
                                                    }
                                                }}
                                                className={`p-1 rounded ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Story Related Characters */}
                                {activeTab === 'story' && (
                                    <div>
                                        <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>登场人物</label>
                                        <div className="space-y-2 mb-2">
                                            {editForm.relatedCharacters.map((rel, idx) => {
                                                const target = settingsData.characters.find(c => c.id === rel.characterId);
                                                return (
                                                    <div key={idx} className={`flex items-center gap-2 text-sm p-2 rounded border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                                        <span className="font-medium">{target?.name || '未知'}</span>
                                                        <span className="text-gray-400 text-xs">饰</span>
                                                        <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>{rel.role}</span>
                                                        <button 
                                                            onClick={() => {
                                                                const newRels = [...editForm.relatedCharacters];
                                                                newRels.splice(idx, 1);
                                                                setEditForm({...editForm, relatedCharacters: newRels});
                                                            }}
                                                            className="ml-auto text-gray-400 hover:text-red-500"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                         <div className="flex gap-2">
                                            <select 
                                                id="story-char-target"
                                                className={`flex-1 text-sm border rounded p-1 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-300'}`}
                                            >
                                                <option value="">选择人物</option>
                                                {settingsData.characters.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                            <input id="story-char-role" type="text" placeholder="角色" className={`w-20 text-sm border rounded p-1 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-300'}`} />
                                            <button 
                                                onClick={() => {
                                                    const characterId = document.getElementById('story-char-target').value;
                                                    const role = document.getElementById('story-char-role').value;
                                                    if (characterId && role) {
                                                        setEditForm({ ...editForm, relatedCharacters: [...editForm.relatedCharacters, { characterId, role }] });
                                                        document.getElementById('story-char-role').value = '';
                                                        document.getElementById('story-char-target').value = '';
                                                    }
                                                }}
                                                className={`p-1 rounded ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Editor */}
                        <div className={`flex-1 flex flex-col relative ${darkMode ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
                            <div className="flex-1 overflow-hidden relative">
                                <MythEditor
                                    initialContent={editForm.content}
                                    onChange={(doc) => setEditForm(prev => ({ ...prev, content: doc }))}
                                    spellCheckEnabled={false}
                                    darkMode={darkMode}
                                    uploadFile={handleUploadFile}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Add Category Modal */}
            <Modal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                title="新建分类"
            >
                <div className="space-y-4 pt-2">
                    <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleConfirmAddCategory()}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                        placeholder="输入分类名称..."
                        autoFocus
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setIsCategoryModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleConfirmAddCategory}
                            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                                !newCategoryName.trim() 
                                ? 'bg-gray-300 cursor-not-allowed' 
                                : 'bg-purple-600 hover:bg-purple-700'
                            }`}
                            disabled={!newCategoryName.trim()}
                        >
                            确定
                        </button>
                    </div>
                </div>
            </Modal>
            
            {showGraph && activeTab === 'character' && (
                <CharacterGraph 
                    characters={settingsData.characters} 
                    onClose={() => setShowGraph(false)}
                    darkMode={darkMode}
                    initialFocusId={graphFocusId}
                />
            )}
        </div>
    );
};

export default SettingsPage;