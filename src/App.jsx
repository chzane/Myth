import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

import HomePage from './pages/HomePage.jsx'
import EditorPage from './pages/EditorPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'


function App() {
	return (
		<BrowserRouter>
			<nav>
				<Link to="/">Home</Link> |{" "}
				<Link to="/editor">Editor</Link> |{" "}
				<Link to="/contact">Contact</Link>
			</nav>

			<Routes>
				<Route path="/" element={<HomePage />} />
				<Route path="/editor" element={<EditorPage />} />
				<Route path="*" element={<NotFoundPage path={window.location.pathname} />} />
			</Routes>
		</BrowserRouter>
	)
}

export default App
