import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../utils/canvasUtils';
import { ZoomIn, ZoomOut, RotateCcw, Check } from 'lucide-react';

const ImageCropper = ({ imageSrc, onCropComplete, onCancel }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [rotation, setRotation] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropChange = (crop) => {
        setCrop(crop);
    };

    const onRotationChange = (rotation) => {
        setRotation(rotation);
    };

    const onZoomChange = (zoom) => {
        setZoom(zoom);
    };

    const onCropCompleteHandler = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const showCroppedImage = useCallback(async () => {
        try {
            const croppedImage = await getCroppedImg(
                imageSrc,
                croppedAreaPixels,
                rotation
            );
            onCropComplete(croppedImage);
        } catch (e) {
            console.error(e);
        }
    }, [imageSrc, croppedAreaPixels, rotation, onCropComplete]);

    return (
        <div className="flex flex-col h-[600px] w-full">
            <div className="relative flex-1 bg-black rounded-t-[16px] overflow-hidden">
                <Cropper
                    image={imageSrc}
                    crop={crop}
                    rotation={rotation}
                    zoom={zoom}
                    aspect={5 / 7} // 16-kai approximation (similar to 200/280px in BookSwitcher)
                    onCropChange={onCropChange}
                    onRotationChange={onRotationChange}
                    onCropComplete={onCropCompleteHandler}
                    onZoomChange={onZoomChange}
                />
            </div>
            
            <div className="p-6 bg-white border-t border-gray-100 rounded-b-[16px] space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-500 w-12">缩放</span>
                        <ZoomOut size={16} className="text-gray-400" />
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(e.target.value)}
                            className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                        />
                        <ZoomIn size={16} className="text-gray-400" />
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-500 w-12">旋转</span>
                        <RotateCcw size={16} className="text-gray-400" />
                        <input
                            type="range"
                            value={rotation}
                            min={0}
                            max={360}
                            step={1}
                            aria-labelledby="Rotation"
                            onChange={(e) => setRotation(e.target.value)}
                            className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                        />
                        <span className="text-xs text-gray-400 w-8 text-right">{rotation}°</span>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-[16px] hover:bg-gray-50 transition-colors"
                    >
                        取消
                    </button>
                    <button
                        onClick={showCroppedImage}
                        className="px-6 py-2 bg-black text-white rounded-[16px] hover:bg-gray-800 transition-colors flex items-center gap-2"
                    >
                        <Check size={18} />
                        完成裁剪
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageCropper;
