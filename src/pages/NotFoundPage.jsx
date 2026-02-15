function NotFoundPage() {
    return (
        <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center px-4">
            <div className="text-center">
                <h1 className="text-4xl font-bold mb-2">404</h1>
                <h2 className="text-xl font-medium mb-4">未找到页面</h2>
                <p className="text-gray-600 mb-6">{window.location.pathname}</p>
                <a
                    href="/"
                    className="inline-block px-6 py-2 border border-black text-black hover:bg-black hover:text-white transition-colors duration-200 rounded-[16px]"
                >
                    回到主页
                </a>
            </div>
        </div>
    )
}

export default NotFoundPage;
