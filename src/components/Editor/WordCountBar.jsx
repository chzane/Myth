import React, { useState, useRef } from 'react';
import { useClickOutside } from '@mantine/hooks';
import SpellCheckButton from './SpellCheckButton';

const StatsPopover = ({ title, stats, onClose, darkMode }) => {
    const ref = useClickOutside(() => onClose());

    return (
        <div
            ref={ref}
            className={`absolute bottom-8 left-0 z-50 p-3 rounded-lg shadow-xl border w-48 animate-in fade-in zoom-in-95 duration-200
                ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-700'}
            `}
            style={{ "borderRadius": "16px" }}
        >
            <div className="text-xs font-bold mb-2 pb-1 border-b border-gray-200/20">{title}</div>
            <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                    <span className="opacity-70">中文</span>
                    <span className="font-mono">{stats.chinese}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="opacity-70">英文单词</span>
                    <span className="font-mono">{stats.english}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="opacity-70">特殊字符</span>
                    <span className="font-mono">{stats.special}</span>
                </div>
                <div className="h-px bg-gray-200/20 my-1"></div>
                <div className="flex justify-between items-center font-bold">
                    <span>总计</span>
                    <span className="font-mono">{stats.total}</span>
                </div>
            </div>
        </div>
    );
};

const WordCountBar = ({ totalStats, currentStats, darkMode, spellCheckEnabled, onToggleSpellCheck }) => {
    const [showTotalDetails, setShowTotalDetails] = useState(false);
    const [showCurrentDetails, setShowCurrentDetails] = useState(false);

    return (
        <div className={`
            h-6 text-[10px] px-4 flex items-center gap-6 border-t select-none shrink-0
            ${darkMode ? 'bg-gray-900 border-gray-800 text-gray-400' : 'bg-white border-gray-200 text-gray-500'}
        `}>
            {/* Total Stats */}
            <div className="relative">
                <button
                    onClick={() => {
                        setShowTotalDetails(!showTotalDetails);
                        setShowCurrentDetails(false);
                    }}
                    className={`hover:text-gray-900 dark:hover:text-gray-200 transition-colors flex items-center gap-1.5 ${showTotalDetails ? 'text-blue-500 dark:text-blue-400' : ''}`}
                >
                    <span>全书字数</span>
                    <span className="font-mono">{totalStats.total}</span>
                </button>
                {showTotalDetails && (
                    <StatsPopover
                        title="全书统计"
                        stats={totalStats}
                        onClose={() => setShowTotalDetails(false)}
                        darkMode={darkMode}
                    />
                )}
            </div>

            <div className="w-px h-3 bg-gray-300 dark:bg-gray-700"></div>

            {/* Current Chapter Stats */}
            <div className="relative">
                <button
                    onClick={() => {
                        setShowCurrentDetails(!showCurrentDetails);
                        setShowTotalDetails(false);
                    }}
                    className={`hover:text-gray-900 dark:hover:text-gray-200 transition-colors flex items-center gap-1.5 ${showCurrentDetails ? 'text-blue-500 dark:text-blue-400' : ''}`}
                >
                    <span>本章字数</span>
                    <span className="font-mono">{currentStats.total}</span>
                </button>
                {showCurrentDetails && (
                    <StatsPopover
                        title="本章统计"
                        stats={currentStats}
                        onClose={() => setShowCurrentDetails(false)}
                        darkMode={darkMode}
                    />
                )}
            </div>

            <div className="w-px h-3 bg-gray-300 dark:bg-gray-700"></div>

            {/* Spell Check */}
            <SpellCheckButton
                darkMode={darkMode}
                enabled={spellCheckEnabled}
                onToggle={onToggleSpellCheck}
            />
        </div>
    );
};

export default WordCountBar;
