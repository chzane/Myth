import React, { useState, useEffect } from 'react';
import { List, SpellCheck } from 'lucide-react';
import SpellCheckSidebar from './SpellCheckSidebar';

const RightSidebar = ({ 
    outline, 
    spellCheckEnabled, 
    spellErrors, 
    onJumpToHeading, 
    onJumpToError, 
    darkMode 
}) => {
    // Tabs: 'outline' | 'spellcheck'
    const [activeTab, setActiveTab] = useState('outline');

    // Automatically switch to spellcheck tab when enabled, but allow switching back
    useEffect(() => {
        if (spellCheckEnabled) {
            setActiveTab('spellcheck');
        } else {
            setActiveTab('outline');
        }
    }, [spellCheckEnabled]);

    return (
        <div className="flex flex-col h-full">
            {/* Tab Header */}
            <div className="flex items-center border-b border-gray-200/50 dark:border-gray-800/50">
                <button
                    className={`
                        flex-1 py-3 text-xs font-medium flex items-center justify-center gap-2 transition-colors
                        ${activeTab === 'outline' 
                            ? 'text-black dark:text-white border-b-2 border-black dark:border-white' 
                            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}
                    `}
                    onClick={() => setActiveTab('outline')}
                >
                    <List size={14} />
                    大纲
                </button>
                
                {spellCheckEnabled && (
                    <button
                        className={`
                            flex-1 py-3 text-xs font-medium flex items-center justify-center gap-2 transition-colors
                            ${activeTab === 'spellcheck' 
                                ? 'text-black dark:text-white border-b-2 border-black dark:border-white' 
                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}
                        `}
                        onClick={() => setActiveTab('spellcheck')}
                    >
                        <SpellCheck size={14} />
                        拼写检查
                        {spellErrors.length > 0 && (
                            <span className="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-1.5 rounded-full text-[10px]">
                                {spellErrors.length}
                            </span>
                        )}
                    </button>
                )}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'outline' && (
                    <div className="h-full flex flex-col">
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {outline.length === 0 ? (
                                <div className="text-gray-400 text-sm text-center py-8">暂无大纲</div>
                            ) : (
                                outline.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`
                                            cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 rounded-lg py-1 px-2 text-sm transition-colors truncate
                                            ${item.level === 1 ? 'font-bold' : ''}
                                            ${item.level === 2 ? 'pl-4' : ''}
                                            ${item.level === 3 ? 'pl-8' : ''}
                                        `}
                                        onClick={() => onJumpToHeading(item.id)}
                                        title={item.text}
                                    >
                                        {item.text || '无标题'}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'spellcheck' && spellCheckEnabled && (
                    <div className="h-full">
                        <SpellCheckSidebar 
                            errors={spellErrors} 
                            onJumpToError={onJumpToError}
                            darkMode={darkMode}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default RightSidebar;
