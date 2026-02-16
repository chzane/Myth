import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useBook } from '../../contexts/BookContext';
import "./Yiyan.css";

function Yiyan() {
    const [yiyan, setYiyan] = useState("");
    const [fromname, setFromname] = useState("");
    const [fromwhoname, setFromwhoname] = useState("");
    const { currentBookData, saveBookData } = useBook();

    useEffect(() => {
        fetchYiyan();
    }, []);

    const fetchYiyan = async () => {
        try {
            const response = await fetch("https://v1.hitokoto.cn/?encode=json&c=a&c=b&c=d&c=e&c=h&c=i&c=j&c=k", {
                method: "GET",
            });
            const data = await response.json();
            setYiyan(data.hitokoto);
            setFromname(data.from);
            setFromwhoname(data.from_who);
        } catch (error) {
            console.error("Error fetching yiyan:", error);
        }
    };

    const handleSave = async (e) => {
        e.stopPropagation();
        if (!currentBookData) {
            alert('请先打开书本');
            return;
        }
        
        const content = `${yiyan}（出自「${fromname || '未知'}」，作者「${fromwhoname || '未知'}」）`;
        const now = new Date();
        const timeString = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        const newInspiration = {
            id: Date.now(),
            text: content,
            date: timeString
        };
        
        const newInspirations = [...(currentBookData.inspirations || []), newInspiration];
        await saveBookData('inspirations', newInspirations);
        
        // Visual feedback could be added here, e.g. changing icon to filled heart momentarily
        const btn = e.currentTarget;
        btn.classList.add('text-pink-500', 'scale-125');
        setTimeout(() => {
            btn.classList.remove('text-pink-500', 'scale-125');
        }, 500);
    };

    return (
        <div className="group inline-flex items-center gap-2 max-w-full">
            <span className='yiyan-text cursor-pointer hover:text-white transition-colors truncate' onClick={fetchYiyan} title="点击刷新">
                {yiyan}
                {fromname && (
                    <span className="text-gray-100 text-sm ml-2 italic font-light">
                        —— {fromname} {fromwhoname ? `• ${fromwhoname}` : ''}
                    </span>
                )}
            </span>
            <button 
                onClick={handleSave}
                className="opacity-0 group-hover:opacity-100 transition-all duration-300 p-1.5 hover:bg-white/10 rounded-full text-white/60 hover:text-pink-400 active:scale-95"
                title="收藏到灵感"
            >
                <Heart size={16} />
            </button>
        </div>
    );
}

export default Yiyan;
