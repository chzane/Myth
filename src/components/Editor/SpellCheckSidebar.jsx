import React from 'react';
import { AlertTriangle, MapPin } from 'lucide-react';

const SpellCheckSidebar = ({ errors, onJumpToError, darkMode }) => {
    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-200/50 dark:border-gray-800/50 flex justify-between items-center whitespace-nowrap overflow-hidden">
                <span className="font-medium text-sm text-gray-500">拼写检查</span>
                <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{errors.length}</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {errors.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm gap-2">
                        <span className="text-2xl">✓</span>
                        <span>没有发现拼写错误</span>
                    </div>
                ) : (
                    errors.map((error, index) => (
                        <div 
                            key={`${error.word}-${index}`}
                            className={`
                                group relative p-3 rounded-lg border transition-all cursor-pointer
                                ${darkMode 
                                    ? 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-800 hover:border-red-500/30' 
                                    : 'bg-white border-gray-100 hover:border-red-200 hover:shadow-sm'}
                            `}
                            onClick={() => onJumpToError(error)}
                        >
                            <div className="flex items-start justify-between mb-1">
                                <span className="font-medium text-red-500 line-through decoration-red-500/30 decoration-2">
                                    {error.word}
                                </span>
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider">{error.type}</span>
                            </div>
                            
                            {error.suggestions && error.suggestions.length > 0 && (
                                <div className="mt-2 text-sm">
                                    <div className="text-xs text-gray-400 mb-1">建议修改:</div>
                                    <div className="flex flex-wrap gap-1">
                                        {error.suggestions.slice(0, 3).map(s => (
                                            <span 
                                                key={s} 
                                                className={`
                                                    px-2 py-0.5 rounded text-xs font-medium
                                                    ${darkMode 
                                                        ? 'bg-green-900/20 text-green-400' 
                                                        : 'bg-green-50 text-green-700 border border-green-100'}
                                                `}
                                            >
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default SpellCheckSidebar;
