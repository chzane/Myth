import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

import HomePage from './pages/HomePage.jsx'
import EditorPage from './pages/EditorPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import NewBookPage from './pages/NewBookPage.jsx'
import { BookProvider } from './contexts/BookContext.jsx';

function App() {
	return (
		<BookProvider>
			<BrowserRouter>
				<Routes>
					<Route path="/" element={<HomePage />} />
					<Route path="/editor" element={<EditorPage />} />
					<Route path="/editor/:chapterId" element={<EditorPage />} />
					<Route path="/new-book" element={<NewBookPage />} />
					<Route path="*" element={<NotFoundPage />} />
				</Routes>
			</BrowserRouter>
		</BookProvider>
	)
}

export default App
