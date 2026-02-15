import React, { createContext, useContext, useState, useEffect } from 'react';
import BookManager from '../utils/BookManager';

const BookContext = createContext();

export const useBook = () => useContext(BookContext);

export const BookProvider = ({ children }) => {
    const [books, setBooks] = useState([]);
    const [currentBook, setCurrentBook] = useState(null);
    const [currentBookData, setCurrentBookData] = useState({
        todos: [],
        chapters: [],
        inspirations: [],
        settings: {},
        info: {}
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBooks();
    }, []);

    const loadBooks = async () => {
        setLoading(true);
        try {
            await BookManager.init();
            const loadedBooks = await BookManager.getBooks();
            setBooks(loadedBooks);
            
            // Try to load last opened book from localStorage or pick the first one
            const lastBookId = localStorage.getItem('lastBookId');
            if (lastBookId) {
                const book = loadedBooks.find(b => b.id === lastBookId);
                if (book) {
                    await switchBook(book);
                }
            } else if (loadedBooks.length > 0) {
                await switchBook(loadedBooks[0]);
            }
        } catch (error) {
            console.error("Failed to load books:", error);
        } finally {
            setLoading(false);
        }
    };

    const switchBook = async (book) => {
        setLoading(true);
        try {
            const data = await BookManager.loadBookData(book.path);
            if (data) {
                setCurrentBook(book);
                setCurrentBookData(data);
                localStorage.setItem('lastBookId', book.id);
            }
        } catch (error) {
            console.error("Failed to switch book:", error);
        } finally {
            setLoading(false);
        }
    };

    const addBook = async (bookMeta) => {
        try {
            const newBook = await BookManager.createBook(bookMeta);
            setBooks(prev => [...prev, newBook]);
            await switchBook(newBook);
            return newBook;
        } catch (error) {
            console.error("Failed to add book:", error);
            throw error;
        }
    };

    const saveBookData = async (type, data) => {
        if (!currentBook) return;
        
        try {
            await BookManager.saveBookData(currentBook.path, type, data);
            setCurrentBookData(prev => ({
                ...prev,
                [type]: data
            }));
        } catch (error) {
            console.error(`Failed to save ${type}:`, error);
        }
    };

    return (
        <BookContext.Provider value={{
            books,
            currentBook,
            currentBookData,
            loading,
            switchBook,
            addBook,
            saveBookData,
            refreshBooks: loadBooks
        }}>
            {children}
        </BookContext.Provider>
    );
};
