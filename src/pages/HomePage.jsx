import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import {
    Plus,
    Check,
    Book,
    ChevronDown
} from 'lucide-react';
import {
    RiSunFill,
    RiCupFill,
    RiMoonClearFill
} from "react-icons/ri";
import Yiyan from '../components/Yiyan/Yiyan';
import Modal from '../components/UI/Modal';
import BookSwitcher from '../components/BookSwitcher/BookSwitcher';
import { useBook } from '../contexts/BookContext';

import welcomeBannerImages from '../assets/images/background/welcome_banner.jpeg';

const HomePage = () => {
    const navigate = useNavigate();
    const { currentBook, currentBookData, saveBookData, loading } = useBook();
    const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

    // Local state for inputs
    const [newTodo, setNewTodo] = useState('');
    const [isAddingTodo, setIsAddingTodo] = useState(false);
    const [newInspiration, setNewInspiration] = useState('');
    const [isAddingInspiration, setIsAddingInspiration] = useState(false);

    // Derived data from context or default to empty
    const todos = currentBookData?.todos || [];
    const chapters = currentBookData?.chapters || [];
    const inspirations = currentBookData?.inspirations || [];
    const settings = currentBookData?.settings || {};
    
    const worldViews = settings.worldViews || [];
    const stories = settings.stories || [];
    const characters = settings.characters || [];

    // Mock Data for Top Navigation
    const navItems = [
        { label: '设定集', icon: '☘️', path: '/settings' },
        { label: '素材库', icon: '📚', path: '/materials' },
        { label: '图书馆', icon: '📖', path: '/library' },
        { label: '灵感碎片', icon: '💡', path: '/inspirations' },
    ];

    // Handlers
    const toggleTodo = async (id) => {
        const updatedTodos = todos.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        );
        await saveBookData('todos', updatedTodos);
    };

    const handleAddTodo = async () => {
        if (newTodo.trim()) {
            const updatedTodos = [...todos, { id: Date.now(), text: newTodo, completed: false }];
            await saveBookData('todos', updatedTodos);
            setNewTodo('');
            setIsAddingTodo(false);
        }
    };

    const handleAddInspiration = async () => {
        if (newInspiration.trim()) {
            const now = new Date();
            const timeString = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
            const updatedInspirations = [...inspirations, { id: Date.now(), text: newInspiration, date: timeString }];
            await saveBookData('inspirations', updatedInspirations);
            setNewInspiration('');
            setIsAddingInspiration(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case '未开始': return 'bg-gray-100 text-gray-600 border-gray-200';
            case '进行中': return 'bg-black text-white border-black';
            case '已完成': return 'bg-gray-200 text-gray-800 border-gray-300';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Welcome Banner */}
                <div
                    className="text-white p-9 rounded-[16px] shadow-md bg-cover bg-center relative"
                    style={{ backgroundImage: `url(${welcomeBannerImages})` }}
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold inline-flex items-center gap-2">
                                {(() => {
                                    const hour = new Date().getHours();
                                    if (hour >= 0 && hour < 6) return (<><RiSunFill />早上好</>);
                                    if (hour < 12) return (<><RiSunFill />上午好</>);
                                    if (hour < 18) return (<><RiCupFill />下午好</>);
                                    return (<><RiMoonClearFill />晚上好</>);
                                })()}, {(process.env.USERNAME || process.env.USER || 'User').charAt(0).toUpperCase() + (process.env.USERNAME || process.env.USER || 'User').slice(1)}
                            </h1>
                            <p className="mt-2 text-md text-gray-200"><Yiyan />&nbsp;</p>
                        </div>

                        {/* Book Switcher Button */}
                        <button
                            onClick={() => setIsSwitcherOpen(true)}
                            className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-[16px] hover:bg-black/50 transition-colors border border-white/20"
                        >
                            <Book size={18} />
                            <span className="font-medium max-w-[150px] truncate">
                                {currentBook ? currentBook.title : '选择书本'}
                            </span>
                            <ChevronDown size={16} />
                        </button>
                    </div>
                </div>

                {!currentBook ? (
                    <div className="text-center py-20 bg-gray-50 rounded-[16px]">
                        <h2 className="text-xl font-bold mb-4">还没有打开书本</h2>
                        <button 
                            onClick={() => setIsSwitcherOpen(true)}
                            className="px-6 py-2 bg-black text-white rounded-[16px] hover:bg-gray-800"
                        >
                            打开或创建书本
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Top Navigation */}
                        <div className="grid grid-cols-4 gap-4">
                            {navItems.map((item, index) => (
                                <button
                                    key={index}
                                    onClick={() => navigate(item.path)}
                                    className="flex flex-col items-center justify-center p-1 rounded-[16px] hover:border-black hover:bg-gray-50 transition-all duration-200 group cursor-pointer"
                                >
                                    <span className="text-md">
                                        <span className='mr-2'>{item.icon}</span>
                                        {item.label}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Middle Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                            {/* Todo List */}
                            <div className="border border-none rounded-[16px] p-6 flex flex-col bg-white hover:shadow-sm transition-shadow">
                                <h3 className="text-md font-bold mb-4 flex items-center gap-2">
                                    Todo
                                </h3>
                                <div className="flex-1 overflow-y-auto space-y-0 pr-2 custom-scrollbar min-h-[200px]">
                                    {todos.length === 0 && <p className="text-gray-400 text-sm text-center py-4">暂无待办事项</p>}
                                    {todos.map(todo => (
                                        <div
                                            key={todo.id}
                                            className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-[16px] cursor-pointer group"
                                            onClick={() => toggleTodo(todo.id)}
                                        >
                                            <div className={`mt-1 w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors ${todo.completed ? 'bg-black border-black' : 'border-gray-300 group-hover:border-gray-400'}`}>
                                                {todo.completed && <Check size={12} className="text-white" />}
                                            </div>
                                            <span className={`text-sm leading-relaxed ${todo.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                                {todo.text}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    {isAddingTodo ? (
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newTodo}
                                                onChange={(e) => setNewTodo(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
                                                placeholder="输入待办事项..."
                                                className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-[16px] focus:outline-none focus:border-black"
                                                autoFocus
                                            />
                                            <button onClick={handleAddTodo} className="p-1 hover:bg-gray-100 rounded-[16px]">
                                                <Plus size={18} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setIsAddingTodo(true)}
                                            className="w-full py-2 text-sm text-gray-500 hover:text-black hover:bg-gray-50 rounded-[16px] border border-dashed border-gray-300 hover:border-black transition-all flex items-center justify-center gap-2"
                                        >
                                            <Plus size={16} /> 新增Todo
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Main Text (Chapters) */}
                            <div className="border border-none rounded-[16px] p-6 flex flex-col bg-white hover:shadow-sm transition-shadow">
                                <h3 className="text-md font-bold mb-4 flex items-center gap-2">
                                    正文
                                </h3>
                                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar min-h-[200px]">
                                    {chapters.length === 0 && <p className="text-gray-400 text-sm text-center py-4">暂无章节</p>}
                                    {chapters.map(chapter => (
                                        <div
                                            key={chapter.id}
                                            onClick={() => navigate(`/editor/${chapter.id}`)}
                                            className="p-3 border border-gray-100 rounded-[16px] hover:border-black hover:bg-gray-50 cursor-pointer transition-all flex justify-between items-center group"
                                        >
                                            <span className="font-medium text-gray-800">{chapter.title}</span>
                                            <span className="text-xs text-gray-400 group-hover:text-black transition-colors">编辑</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => window.location.href = "/editor"}
                                        className="w-full py-2 text-sm text-gray-500 hover:text-black hover:bg-gray-50 rounded-[16px] border border-dashed border-gray-300 hover:border-black transition-all flex items-center justify-center gap-2"
                                    >
                                        <Plus size={16} /> 新增章节
                                    </button>
                                </div>
                            </div>

                            {/* Inspiration Fragments */}
                            <div className="border border-none rounded-[16px] p-6 flex flex-col bg-white hover:shadow-sm transition-shadow">
                                <h3 className="text-md font-bold mb-4 flex items-center gap-2">
                                    灵感碎片
                                </h3>
                                <div
                                    className="flex-1 max-h-[300px] overflow-y-auto space-y-3 pr-2 custom-scrollbar min-h-[200px]"
                                    ref={(node) => {
                                        if (node) {
                                            node.scrollTop = node.scrollHeight;
                                        }
                                    }}
                                >
                                    {inspirations.length === 0 && <p className="text-gray-400 text-sm text-center py-4">暂无灵感</p>}
                                    {inspirations.map(insp => (
                                        <div key={insp.id} className="p-3 bg-gray-50 rounded-[16px] border border-transparent hover:border-gray-200 transition-all">
                                            <p className="text-sm text-gray-800 mb-2">{insp.text}</p>
                                            <p className="text-xs text-gray-400 text-right">{insp.date}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    {isAddingInspiration ? (
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newInspiration}
                                                onChange={(e) => setNewInspiration(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddInspiration()}
                                                placeholder="记录灵感..."
                                                className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-[16px] focus:outline-none focus:border-black"
                                                autoFocus
                                            />
                                            <button onClick={handleAddInspiration} className="p-1 hover:bg-gray-100 rounded-[16px]">
                                                <Plus size={18} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setIsAddingInspiration(true)}
                                            className="w-full py-2 text-sm text-gray-500 hover:text-black hover:bg-gray-50 rounded-[16px] border border-dashed border-gray-300 hover:border-black transition-all flex items-center justify-center gap-2"
                                        >
                                            <Plus size={16} /> 新增灵感碎片
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Bottom Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                            {/* Worldview */}
                            <div className="border border-none rounded-[16px] p-6 hover:shadow-sm transition-shadow">
                                <h3 className="text-md font-bold mb-4 flex items-center gap-2">
                                    世界观
                                </h3>
                                <ul className="space-y-2">
                                    {worldViews.length === 0 && <li className="text-gray-400 text-sm">暂无世界观设定</li>}
                                    {worldViews.map((item, index) => (
                                        <li key={index} className="flex items-center gap-2 text-gray-700 hover:text-black cursor-pointer p-2 hover:bg-gray-50 rounded-[16px] transition-colors">
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Stories */}
                            <div className="border border-none rounded-[16px] p-6 hover:shadow-sm transition-shadow">
                                <h3 className="text-md font-bold mb-4 flex items-center gap-2">
                                    故事
                                </h3>
                                <ul className="space-y-2">
                                    {stories.length === 0 && <li className="text-gray-400 text-sm">暂无故事设定</li>}
                                    {stories.map((item, index) => (
                                        <li key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-[16px] transition-colors cursor-pointer group">
                                            <span className="text-gray-700 group-hover:text-black">{item.title}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(item.status)}`}>
                                                {item.status}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Characters */}
                            <div className="border border-none rounded-[16px] p-6 hover:shadow-sm transition-shadow">
                                <h3 className="text-md font-bold mb-4 flex items-center gap-2">
                                    人物
                                </h3>
                                <ul className="space-y-2">
                                    {characters.length === 0 && <li className="text-gray-400 text-sm">暂无人物设定</li>}
                                    {characters.map((item, index) => (
                                        <li key={index} className="flex items-center gap-2 text-gray-700 hover:text-black cursor-pointer p-2 hover:bg-gray-50 rounded-[16px] transition-colors">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                                                {item.charAt(0)}
                                            </div>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Book Switcher Modal */}
            <Modal
                isOpen={isSwitcherOpen}
                onClose={() => setIsSwitcherOpen(false)}
                title="切换书本"
                className="max-w-4xl"
            >
                <BookSwitcher onClose={() => setIsSwitcherOpen(false)} />
            </Modal>
        </div>
    );
}

export default HomePage;
