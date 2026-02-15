import React, { useRef, useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBook } from '../../contexts/BookContext';
import BookManager from '../../utils/BookManager';

const BookSwitcher = ({ onClose }) => {
    const { books, currentBook, switchBook, refreshBooks } = useBook();
    const navigate = useNavigate();
    const scrollContainerRef = useRef(null);
    const [activeIndex, setActiveIndex] = useState(0);

    // Initialize active index based on current book
    useEffect(() => {
        if (currentBook && books.length > 0) {
            const index = books.findIndex(b => b.id === currentBook.id);
            if (index !== -1) {
                setActiveIndex(index);
                // Scroll to item after render
                setTimeout(() => scrollToItem(index), 100);
            }
        }
    }, [currentBook, books]);

    const scrollToItem = (index) => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const itemWidth = 200; 
            const gap = 32; 
            const totalItemWidth = itemWidth + gap;
            const scrollPos = index * totalItemWidth;
            
            container.scrollTo({
                left: scrollPos,
                behavior: 'smooth'
            });
        }
    };

    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const itemWidth = 200; 
            const gap = 32;
            const totalItemWidth = itemWidth + gap;
            
            // Simple calculation: scrollLeft / totalItemWidth
            // Use Math.round for snapping behavior, but we also want to track continuous scroll for better feel
            const rawIndex = container.scrollLeft / totalItemWidth;
            const index = Math.round(rawIndex);
            
            // Clamp index
            // Note: books.length now includes the "New Book" card implicitly in our logic
            // We have books.length items + 1 new book card
            const totalItems = books.length + 1;
            const clampedIndex = Math.max(0, Math.min(index, totalItems - 1));
            
            if (clampedIndex !== activeIndex) {
                setActiveIndex(clampedIndex);
            }
        }
    };

    const handleBookSelect = (book) => {
        switchBook(book);
        if (onClose) onClose();
    };

    const handleCardClick = (index, book) => {
        if (index === activeIndex) {
            handleBookSelect(book);
        } else {
            setActiveIndex(index);
            scrollToItem(index);
        }
    };

    const handleNewBookCardClick = (index) => {
        if (index === activeIndex) {
            handleNewBook();
        } else {
            setActiveIndex(index);
            scrollToItem(index);
        }
    };

    const handleDeleteBook = async (e, bookId) => {
        e.stopPropagation();
        if (window.confirm('确定要删除这本书吗？此操作不可恢复。')) {
            await BookManager.deleteBook(bookId);
            refreshBooks();
        }
    };

    const handleNewBook = () => {
        navigate('/new-book');
        if (onClose) onClose();
    };

    return (
        <div className="flex flex-col items-center w-full">
            <div 
                ref={scrollContainerRef}
                className="flex overflow-x-auto gap-8 p-8 w-full snap-x snap-mandatory scrollbar-hide items-center h-[400px]"
                onScroll={handleScroll}
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {/* Spacer for centering first item */}
                <div className="shrink-0 w-[calc(50%-100px)]"></div>

                {books.map((book, index) => {
                    const isActive = index === activeIndex;
                    return (
                        <div 
                            key={book.id}
                            className={`shrink-0 relative transition-all duration-300 snap-center cursor-pointer
                                ${isActive ? 'scale-110 opacity-100 blur-0 z-10' : 'scale-90 opacity-60 blur-[2px] hover:opacity-80 hover:blur-0'}
                            `}
                            onClick={() => handleCardClick(index, book)}
                            style={{ width: '200px' }}
                        >
                            {/* Book Cover */}
                            <div className="w-[200px] h-[280px] bg-gray-100 rounded-[16px] shadow-lg overflow-hidden relative group">
                                {book.cover ? (
                                    <img 
                                        src={book.cover.startsWith('file://') || book.cover.startsWith('http') ? book.cover : `myth://${book.cover}`} 
                                        alt={book.title} 
                                        className="w-full h-full object-cover" 
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 text-4xl">
                                        📖
                                    </div>
                                )}
                                
                                {/* Delete Button (Visible on hover) */}
                                <button 
                                    className="absolute top-2 right-2 p-2 bg-white/80 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white z-20"
                                    onClick={(e) => handleDeleteBook(e, book.id)}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            
                            {/* Book Info */}
                            <div className="mt-4 text-center">
                                <h3 className={`font-bold text-lg truncate ${isActive ? 'text-black' : 'text-gray-600'}`}>
                                    {book.title}
                                </h3>
                                <p className="text-sm text-gray-500 truncate">
                                    {book.author || '未知作者'}
                                </p>
                            </div>
                        </div>
                    );
                })}

                {/* New Book Card */}
                {(() => {
                    const index = books.length;
                    const isActive = index === activeIndex;
                    return (
                        <div 
                            className={`shrink-0 relative transition-all duration-300 snap-center cursor-pointer
                                ${isActive ? 'scale-110 opacity-100 blur-0 z-10' : 'scale-90 opacity-60 blur-[2px] hover:opacity-80 hover:blur-0'}
                            `}
                            onClick={() => handleNewBookCardClick(index)}
                            style={{ width: '200px' }}
                        >
                            <div className="w-[200px] h-[280px] bg-gray-50 border-2 border-dashed border-gray-300 rounded-[16px] flex flex-col items-center justify-center text-gray-400 hover:border-black hover:text-black transition-colors">
                                <Plus size={48} className="mb-2" />
                                <span className="font-medium">新建书本</span>
                            </div>
                        </div>
                    );
                })()}

                <div className="shrink-0 w-[calc(50%-100px)]"></div>
            </div>
            
            {/* Bottom buttons removed as requested */}
            <div className="h-8"></div> 
        </div>
    );
};

export default BookSwitcher;
