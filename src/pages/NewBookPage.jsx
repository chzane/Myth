import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Folder } from 'lucide-react';
import { useBook } from '../contexts/BookContext';
import BookManager from '../utils/BookManager';
import Modal from '../components/UI/Modal';
import ImageCropper from '../components/UI/ImageCropper';

const NewBookPage = () => {
    const navigate = useNavigate();
    const { addBook } = useBook();
    const [formData, setFormData] = useState({
        title: '',
        author: '',
        description: '',
        location: '',
        cover: ''
    });
    const [loading, setLoading] = useState(false);
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [tempImage, setTempImage] = useState(null);

    const handleSelectLocation = async () => {
        const result = await BookManager.selectDirectory();
        if (result) {
            setFormData(prev => ({ ...prev, location: result }));
        }
    };

    const handleSelectCover = async () => {
        const result = await BookManager.selectImage();
        if (result) {
            const fileUrl = `file://${result}`;
            const img = new Image();
            img.onload = () => {
                const aspect = img.width / img.height;
                const targetAspect = 5 / 7; // 0.714
                const tolerance = 0.05; // Allow small deviation

                if (Math.abs(aspect - targetAspect) > tolerance) {
                    setTempImage(fileUrl);
                    setCropModalOpen(true);
                } else {
                    setFormData(prev => ({ ...prev, cover: fileUrl }));
                }
            };
            img.onerror = () => {
                alert('无法加载图片，请重试');
            };
            img.src = fileUrl;
        }
    };

    const handleCropComplete = (croppedBlobUrl) => {
        setFormData(prev => ({ ...prev, cover: croppedBlobUrl }));
        setCropModalOpen(false);
        setTempImage(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.location) {
            alert('请填写书名并选择存放位置');
            return;
        }

        setLoading(true);
        try {
            await addBook(formData);
            navigate('/');
        } catch (error) {
            alert(`创建失败: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans p-8 flex flex-col items-center">
            <Modal 
                isOpen={cropModalOpen} 
                onClose={() => setCropModalOpen(false)}
                className="max-w-4xl"
            >
                {tempImage && (
                    <ImageCropper
                        imageSrc={tempImage}
                        onCropComplete={handleCropComplete}
                        onCancel={() => setCropModalOpen(false)}
                    />
                )}
            </Modal>

            <div className="w-full max-w-6xl">
                <button 
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-500 hover:text-black mb-8 transition-colors"
                >
                    <ArrowLeft size={20} /> 返回
                </button>

                <h1 className="text-3xl font-bold mb-8">新建书本</h1>

                <form onSubmit={handleSubmit} className="flex gap-12">
                    {/* Left side - Form inputs (70%) */}
                    <div className="flex-[7] space-y-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">书名 <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                className="w-full px-4 py-2 border border-gray-300 rounded-[16px] focus:outline-none focus:border-black transition-colors"
                                placeholder="请输入书名"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">作者</label>
                            <input
                                type="text"
                                value={formData.author}
                                onChange={(e) => setFormData({...formData, author: e.target.value})}
                                className="w-full px-4 py-2 border border-gray-300 rounded-[16px] focus:outline-none focus:border-black transition-colors"
                                placeholder="请输入作者名"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">简介</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                className="w-full px-4 py-2 border border-gray-300 rounded-[16px] focus:outline-none focus:border-black transition-colors h-48 resize-none"
                                placeholder="请输入故事简介..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">存放位置 <span className="text-red-500">*</span></label>
                            <div 
                                onClick={handleSelectLocation}
                                className="w-full px-4 py-3 border border-gray-300 rounded-[16px] hover:border-black cursor-pointer transition-colors flex items-center gap-2 text-gray-500 overflow-hidden"
                            >
                                <Folder size={20} />
                                <span className="truncate flex-1">
                                    {formData.location || '点击选择文件夹'}
                                </span>
                            </div>
                        </div>

                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-black text-white rounded-[16px] font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                            >
                                {loading ? '创建中...' : '创建书本'}
                            </button>
                        </div>
                    </div>

                    {/* Right side - Cover image (30%) */}
                    <div className="flex-[3] space-y-2">
                        <label className="block text-sm font-medium text-gray-700">封面图片</label>
                        <div 
                            onClick={handleSelectCover}
                            className="w-full aspect-[5/7] border-2 border-dashed border-gray-300 rounded-[16px] hover:border-black cursor-pointer transition-colors flex flex-col items-center justify-center text-gray-500 overflow-hidden relative group bg-gray-50"
                        >
                            {formData.cover ? (
                                <>
                                    <img src={formData.cover} alt="Cover" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                        更换图片
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Upload size={32} className="mb-4 text-gray-400" />
                                    <span className="text-sm">点击上传封面</span>
                                    <span className="text-xs text-gray-400 mt-1">支持 16开 比例</span>
                                </>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewBookPage;
