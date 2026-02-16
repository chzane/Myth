import React, { useState } from 'react';
import { SpellCheck } from 'lucide-react';

const SpellCheckButton = ({ editor, darkMode, onToggle, enabled }) => {
    
    const handleCheck = () => {
        onToggle(!enabled);
    };

    return (
        <button 
            onClick={handleCheck}
            className={`
                flex items-center gap-1.5 px-2 py-0.5 rounded-md transition-colors text-[10px]
                ${enabled 
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                    : 'hover:bg-gray-100 text-gray-500 dark:hover:bg-gray-800 dark:text-gray-400'}
            `}
            title="拼写检查"
        >
            <SpellCheck size={12} />
            <span>拼写检查</span>
        </button>
    );
};

export default SpellCheckButton;
