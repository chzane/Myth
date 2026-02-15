const fs = window.require('fs');
const path = window.require('path');
const { ipcRenderer } = window.require('electron');

const { Buffer } = window.require('buffer');

class BookManager {
    constructor() {
        this.userDataPath = null;
        this.booksConfigPath = null;
    }

    async init() {
        if (!this.userDataPath) {
            this.userDataPath = await ipcRenderer.invoke('get-user-data-path');
            this.booksConfigPath = path.join(this.userDataPath, 'books.json');
            
            // Ensure books.json exists
            if (!fs.existsSync(this.booksConfigPath)) {
                fs.writeFileSync(this.booksConfigPath, JSON.stringify([], null, 2));
            }
        }
    }

    async getBooks() {
        await this.init();
        try {
            const data = fs.readFileSync(this.booksConfigPath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error reading books config:', error);
            return [];
        }
    }

    async saveBooksConfig(books) {
        await this.init();
        try {
            fs.writeFileSync(this.booksConfigPath, JSON.stringify(books, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving books config:', error);
            return false;
        }
    }

    async createBook(bookMeta) {
        // bookMeta: { title, author, description, cover, location }
        // Create directory
        const bookDir = path.join(bookMeta.location, bookMeta.title);
        
        if (fs.existsSync(bookDir)) {
            throw new Error('Book directory already exists');
        }

        try {
            fs.mkdirSync(bookDir, { recursive: true });

            // Handle cover image
            let coverPath = bookMeta.cover;
            if (bookMeta.cover) {
                try {
                    if (bookMeta.cover.startsWith('blob:')) {
                        // It's a cropped image blob
                        const response = await fetch(bookMeta.cover);
                        const arrayBuffer = await response.arrayBuffer();
                        const buffer = Buffer.from(arrayBuffer);
                        const targetPath = path.join(bookDir, 'cover.jpg');
                        fs.writeFileSync(targetPath, buffer);
                        coverPath = targetPath;
                    } else {
                        // Handle local file path (may start with file://)
                        let rawPath = bookMeta.cover;
                        if (rawPath.startsWith('file://')) {
                            // On Windows, file:///C:/path -> C:/path. On Mac/Linux, file:///path -> /path
                            // A simple way is to use fileURLToPath if available, or just strip prefix
                            // Since we are in Electron renderer with nodeIntegration, we can try URL
                            try {
                                const { fileURLToPath } = window.require('url');
                                rawPath = fileURLToPath(rawPath);
                            } catch (e) {
                                // Fallback manual strip
                                rawPath = rawPath.replace('file://', '');
                            }
                        }

                        if (fs.existsSync(rawPath)) {
                            // It's a local file path - copy it
                            const ext = path.extname(rawPath);
                            const targetPath = path.join(bookDir, `cover${ext}`);
                            fs.copyFileSync(rawPath, targetPath);
                            coverPath = targetPath;
                        }
                    }
                } catch (imgError) {
                    console.error('Error saving cover image:', imgError);
                    // Keep original path if copy fails
                }
            }

            const bookInfo = {
                id: Date.now().toString(),
                title: bookMeta.title,
                author: bookMeta.author,
                description: bookMeta.description,
                cover: coverPath,
                createdAt: new Date().toISOString(),
                path: bookDir
            };

            // Save book.json
            fs.writeFileSync(path.join(bookDir, 'book.json'), JSON.stringify(bookInfo, null, 2));
            
            // Initialize other files
            fs.writeFileSync(path.join(bookDir, 'todos.json'), JSON.stringify([], null, 2));
            fs.writeFileSync(path.join(bookDir, 'chapters.json'), JSON.stringify([], null, 2));
            fs.writeFileSync(path.join(bookDir, 'inspirations.json'), JSON.stringify([], null, 2));
            fs.writeFileSync(path.join(bookDir, 'settings.json'), JSON.stringify({}, null, 2));
            
            // Add to global config
            const books = await this.getBooks();
            // Need to update the book object in the list with the correct cover path
            books.push(bookInfo);
            await this.saveBooksConfig(books);

            return bookInfo;
        } catch (error) {
            console.error('Error creating book:', error);
            throw error;
        }
    }

    async deleteBook(bookId) {
        const books = await this.getBooks();
        const newBooks = books.filter(b => b.id !== bookId);
        await this.saveBooksConfig(newBooks);
        // Note: We are not deleting the actual folder to be safe, or we could ask user preference.
        // For now, just remove from list.
        return true;
    }

    loadBookData(bookPath) {
        try {
            const todos = JSON.parse(fs.readFileSync(path.join(bookPath, 'todos.json'), 'utf-8'));
            const chapters = JSON.parse(fs.readFileSync(path.join(bookPath, 'chapters.json'), 'utf-8'));
            const inspirations = JSON.parse(fs.readFileSync(path.join(bookPath, 'inspirations.json'), 'utf-8'));
            const settings = JSON.parse(fs.readFileSync(path.join(bookPath, 'settings.json'), 'utf-8'));
            const info = JSON.parse(fs.readFileSync(path.join(bookPath, 'book.json'), 'utf-8'));

            return { info, todos, chapters, inspirations, settings };
        } catch (error) {
            console.error('Error loading book data:', error);
            return null;
        }
    }

    saveBookData(bookPath, dataType, data) {
        // dataType: 'todos', 'chapters', 'inspirations', 'settings', 'info'
        try {
            const filePath = path.join(bookPath, `${dataType}.json`);
            // Handle special case for 'info' -> 'book.json'
            const actualFilePath = dataType === 'info' ? path.join(bookPath, 'book.json') : filePath;
            
            fs.writeFileSync(actualFilePath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error(`Error saving ${dataType}:`, error);
            return false;
        }
    }

    async selectDirectory() {
        return await ipcRenderer.invoke('dialog:openDirectory');
    }

    async selectImage() {
        return await ipcRenderer.invoke('dialog:openFile', {
            filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }]
        });
    }
}

export default new BookManager();
