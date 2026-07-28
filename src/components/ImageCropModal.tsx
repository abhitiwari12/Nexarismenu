import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Check, Crop } from 'lucide-react';

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  fileName: string;
  onCropComplete: (croppedFile: File) => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  fileName,
  onCropComplete,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const VIEWPORT_SIZE = 320; // 1:1 Square cropped size

  // Reset state when new image is loaded
  useEffect(() => {
    if (isOpen) {
      setZoom(1.1); // Start slightly zoomed in for easier framing
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, imageSrc]);

  if (!isOpen) return null;

  // Calculate base fitted size and limits
  const getImageLayout = () => {
    if (!imageRef.current) return { width: VIEWPORT_SIZE, height: VIEWPORT_SIZE, minX: 0, maxX: 0, minY: 0, maxY: 0 };

    const { naturalWidth, naturalHeight } = imageRef.current;
    let baseWidth = VIEWPORT_SIZE;
    let baseHeight = VIEWPORT_SIZE;

    // Scale image to cover viewport
    if (naturalWidth > naturalHeight) {
      // Landscape
      baseHeight = VIEWPORT_SIZE;
      baseWidth = VIEWPORT_SIZE * (naturalWidth / naturalHeight);
    } else {
      // Portrait or Square
      baseWidth = VIEWPORT_SIZE;
      baseHeight = VIEWPORT_SIZE * (naturalHeight / naturalWidth);
    }

    const currentWidth = baseWidth * zoom;
    const currentHeight = baseHeight * zoom;

    // Constraints to ensure the image covers the viewport [0, VIEWPORT_SIZE]
    const limitX = Math.max(0, (currentWidth - VIEWPORT_SIZE) / 2);
    const limitY = Math.max(0, (currentHeight - VIEWPORT_SIZE) / 2);

    return {
      width: currentWidth,
      height: currentHeight,
      minX: -limitX,
      maxX: limitX,
      minY: -limitY,
      maxY: limitY,
    };
  };

  const layout = getImageLayout();

  // Constrain position helper
  const constrainPosition = (x: number, y: number) => {
    return {
      x: Math.min(layout.maxX, Math.max(layout.minX, x)),
      y: Math.min(layout.maxY, Math.max(layout.minY, y)),
    };
  };

  // Drag handlers (Mouse)
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;
    const constrained = constrainPosition(newX, newY);
    setPosition(constrained);
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Touch support for Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    dragStart.current = {
      x: e.touches[0].clientX - position.x,
      y: e.touches[0].clientY - position.y,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const newX = e.touches[0].clientX - dragStart.current.x;
    const newY = e.touches[0].clientY - dragStart.current.y;
    const constrained = constrainPosition(newX, newY);
    setPosition(constrained);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleZoomChange = (newZoom: number) => {
    const val = Math.min(3, Math.max(1, newZoom));
    setZoom(val);
    // After zoom changes, update position to respect new boundaries
    setTimeout(() => {
      setPosition((prev) => {
        // Recalculate with new layout bounds
        const tempLayout = getImageLayout();
        const limitX = Math.max(0, (tempLayout.width - VIEWPORT_SIZE) / 2);
        const limitY = Math.max(0, (tempLayout.height - VIEWPORT_SIZE) / 2);
        return {
          x: Math.min(limitX, Math.max(-limitX, prev.x)),
          y: Math.min(limitY, Math.max(-limitY, prev.y)),
        };
      });
    }, 10);
  };

  // Perform crop on canvas and return File
  const handleCropSave = () => {
    if (!imageRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = 600; // Optimal square size for mobile / web menu rendering
    canvas.height = 600;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    const { naturalWidth, naturalHeight } = img;

    const ratio = naturalWidth / layout.width;

    const sX = (VIEWPORT_SIZE / 2 - position.x) * ratio - (VIEWPORT_SIZE / 2) * ratio;
    const sY = (VIEWPORT_SIZE / 2 - position.y) * ratio - (VIEWPORT_SIZE / 2) * ratio;
    const sWidth = VIEWPORT_SIZE * ratio;
    const sHeight = VIEWPORT_SIZE * ratio;

    ctx.drawImage(
      img,
      sX,
      sY,
      sWidth,
      sHeight, // source region
      0,
      0,
      600,
      600 // destination region
    );

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const croppedFile = new File([blob], fileName || 'dish_image.jpg', {
            type: blob.type || 'image/jpeg',
            lastModified: Date.now(),
          });
          onCropComplete(croppedFile);
        }
      },
      'image/jpeg',
      0.9
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600 dark:text-indigo-400">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Crop Dish Image</h3>
              <p className="text-[10px] text-slate-500">Square ratio optimized for Nexaris Menu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Workspace */}
        <div className="p-6 bg-slate-50 dark:bg-slate-950/40 flex flex-col items-center justify-center gap-4">
          {/* Cropper Viewport */}
          <div
            ref={containerRef}
            className="relative overflow-hidden bg-slate-200 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner select-none cursor-grab active:cursor-grabbing"
            style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* The Image */}
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Source crop"
              draggable={false}
              className="absolute max-w-none origin-center pointer-events-none transition-transform duration-75 select-none"
              style={{
                width: layout.width,
                height: layout.height,
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px)`,
              }}
            />

            {/* Visual Guide Border overlay */}
            <div className="absolute inset-0 border-2 border-indigo-600/80 rounded-2xl pointer-events-none shadow-[0_0_0_9999px_rgba(15,23,42,0.4)]">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-[1px] bg-white/20" />
                <div className="absolute h-full w-[1px] bg-white/20" />
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="w-full space-y-3 px-2">
            <div className="flex items-center gap-3">
              <ZoomOut className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={zoom}
                onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <ZoomIn className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="text-center">
              <span className="text-[10px] text-slate-400 font-medium">
                Drag to position • Scroll/slide to zoom
              </span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleCropSave}
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-100 dark:shadow-none"
          >
            <Check className="w-4 h-4" />
            <span>Crop & Upload</span>
          </button>
        </div>
      </div>
    </div>
  );
};
