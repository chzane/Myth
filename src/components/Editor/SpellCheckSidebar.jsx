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
                                    ? 'bg-black/50 border-gray-800 hover:border-gray-600 hover:bg-gray-900' 
                                    : 'bg-white border-gray-200 hover:border-black hover:shadow-md'}
                            `}
                            onClick={() => onJumpToError(error)}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <span className="font-bold text-red-600 line-through decoration-red-500/30 decoration-2">
                                    {error.word}
                                </span>
                                <span className={`text-[10px] uppercase tracking-wider font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{error.type}</span>
                            </div>
                            
                            {error.suggestions && error.suggestions.length > 0 && (
                                <div className="mt-2 text-sm">
                                    <div className={`text-xs mb-1.5 font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>建议修改:</div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {error.suggestions.slice(0, 3).map(s => (
                                            <span 
                                                key={s} 
                                                className={`
                                                    px-2 py-1 rounded text-xs font-medium border transition-colors
                                                    ${darkMode 
                                                        ? 'bg-gray-900 border-gray-700 text-gray-300 hover:border-gray-500' 
                                                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-white hover:border-black hover:text-black'}
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
