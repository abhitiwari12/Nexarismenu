import React, { useState, useEffect, useRef } from 'react';
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, RotateCcw, Sparkles, Star, Info, Plus, Minus } from 'lucide-react';
import { MenuItem } from '../types';

interface PublicMenuLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  items: MenuItem[];
  initialItemId: string;
  restaurantName?: string;
  tray?: Array<{ id: string; quantity: number }>;
  onAddToTray?: (id: string) => void;
  onRemoveFromTray?: (id: string) => void;
}

export const PublicMenuLightbox: React.FC<PublicMenuLightboxProps> = ({
  isOpen,
  onClose,
  items,
  initialItemId,
  restaurantName,
  tray = [],
  onAddToTray,
  onRemoveFromTray,
}) => {
  // Only navigate between items that have images
  const imageItems = items.filter((item) => item.image_url);
  const initialIndex = imageItems.findIndex((item) => item.id === initialItemId);

  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex >= 0 ? initialIndex : 0);
  const [zoom, setZoom] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState<boolean>(true);

  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const currentItem = imageItems[currentIndex];

  // Sync index when initialItemId changes
  useEffect(() => {
    if (isOpen && initialItemId) {
      const idx = imageItems.findIndex((item) => item.id === initialItemId);
      if (idx >= 0) {
        setCurrentIndex(idx);
        resetZoomState();
      }
    }
  }, [isOpen, initialItemId]);

  // Keyboard navigation & close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, imageItems.length, zoom]);

  if (!isOpen || !currentItem) return null;

  const resetZoomState = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handlePrev = () => {
    if (imageItems.length <= 1) return;
    setCurrentIndex((prev) => (prev === 0 ? imageItems.length - 1 : prev - 1));
    resetZoomState();
  };

  const handleNext = () => {
    if (imageItems.length <= 1) return;
    setCurrentIndex((prev) => (prev === imageItems.length - 1 ? 0 : prev + 1));
    resetZoomState();
  };

  const handleZoomIn = () => {
    setZoom((z) => Math.min(4, z + 0.25));
  };

  const handleZoomOut = () => {
    setZoom((z) => {
      const nextZ = Math.max(1, z - 0.25);
      if (nextZ === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return nextZ;
    });
  };

  // Dragging Math
  const getDragLimits = () => {
    if (!imageRef.current || !viewportRef.current) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };

    const imgRect = imageRef.current.getBoundingClientRect();
    const viewRect = viewportRef.current.getBoundingClientRect();

    // Max movement is based on the overflow size of the zoomed image
    const overflowX = Math.max(0, (imgRect.width - viewRect.width) / 2);
    const overflowY = Math.max(0, (imgRect.height - viewRect.height) / 2);

    return {
      minX: -overflowX,
      maxX: overflowX,
      minY: -overflowY,
      maxY: overflowY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;

    const limits = getDragLimits();
    setPosition({
      x: Math.min(limits.maxX, Math.max(limits.minX, newX)),
      y: Math.min(limits.maxY, Math.max(limits.minY, newY)),
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Touch Support
  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoom <= 1 || e.touches.length !== 1) return;
    setIsDragging(true);
    dragStart.current = {
      x: e.touches[0].clientX - position.x,
      y: e.touches[0].clientY - position.y,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || zoom <= 1 || e.touches.length !== 1) return;
    const newX = e.touches[0].clientX - dragStart.current.x;
    const newY = e.touches[0].clientY - dragStart.current.y;

    const limits = getDragLimits();
    setPosition({
      x: Math.min(limits.maxX, Math.max(limits.minX, newX)),
      y: Math.min(limits.maxY, Math.max(limits.minY, newY)),
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-between bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-300"
      onClick={onClose}
    >
      {/* Upper bar: Logo & Title + Close controls */}
      <div
        className="w-full px-6 py-4 flex items-center justify-between z-10 bg-gradient-to-b from-slate-950 to-transparent"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-widest font-black text-indigo-400">
            {restaurantName || 'Nexaris Interactive Lightbox'}
          </span>
          <span className="text-white text-xs font-semibold">
            Item {currentIndex + 1} of {imageItems.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-1.5 flex items-center gap-1">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 1}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-40 disabled:hover:text-slate-400 transition cursor-pointer"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[10px] text-slate-300 font-extrabold px-1.5 min-w-[32px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 4}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-40 disabled:hover:text-slate-400 transition cursor-pointer"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            {zoom > 1 && (
              <button
                onClick={resetZoomState}
                className="p-1.5 rounded-lg text-indigo-400 hover:text-indigo-300 transition cursor-pointer ml-1 border-l border-slate-800"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className={`p-2.5 rounded-xl transition cursor-pointer border ${
              showDetails
                ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
            title="Toggle Details"
          >
            <Info className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer border border-slate-800"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main viewport area */}
      <div
        ref={viewportRef}
        className="flex-1 w-full relative flex items-center justify-center overflow-hidden"
        onClick={onClose}
      >
        {/* Navigation - Prev Button */}
        {imageItems.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-4 z-10 p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-900 text-slate-300 hover:text-white transition cursor-pointer border border-slate-800/80 md:left-6 shadow-xl"
            title="Previous (Left Arrow)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* The interactive Zoomable Image Container */}
        <div
          className={`relative max-w-full max-h-full flex items-center justify-center transition-all ${
            zoom > 1 ? 'cursor-grab active:cursor-grabbing' : ''
          }`}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <img
            ref={imageRef}
            src={currentItem.image_url}
            alt={currentItem.name}
            className="max-w-[90vw] max-h-[70vh] object-contain rounded-2xl shadow-2xl transition-transform duration-100 ease-out pointer-events-none select-none border border-slate-900"
            style={{
              transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
            }}
          />

          {/* Guide Overlay for navigation / dragging */}
          {zoom > 1 && (
            <div className="absolute inset-0 pointer-events-none rounded-2xl border-2 border-dashed border-indigo-500/20" />
          )}
        </div>

        {/* Navigation - Next Button */}
        {imageItems.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-4 z-10 p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-900 text-slate-300 hover:text-white transition cursor-pointer border border-slate-800/80 md:right-6 shadow-xl"
            title="Next (Right Arrow)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Footer Details info panel */}
      {showDetails && (
        <div
          className="w-full bg-slate-950/90 border-t border-slate-900 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 z-10 animate-in slide-in-from-bottom duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-white text-base font-black tracking-wide">
                {currentItem.name}
              </h3>
              
              {/* Badges */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {currentItem.is_veg ? (
                  <span className="border border-emerald-600/50 bg-emerald-950/30 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    Veg
                  </span>
                ) : (
                  <span className="border border-rose-600/50 bg-rose-950/30 text-rose-400 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    Non-Veg
                  </span>
                )}
                
                {currentItem.is_bestseller && (
                  <span className="text-[9px] font-black text-amber-955 bg-amber-300 border border-amber-400 px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 fill-amber-955" />
                    Bestseller
                  </span>
                )}
                
                {currentItem.is_todays_special && (
                  <span className="text-[9px] font-black text-rose-955 bg-rose-200 border border-rose-300 px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 fill-rose-955" />
                    Today's Special
                  </span>
                )}

                {currentItem.is_jain && (
                  <span className="border border-amber-600/40 bg-amber-950/30 text-amber-400 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    Jain
                  </span>
                )}

                {currentItem.is_no_onion_garlic && (
                  <span className="border border-purple-600/40 bg-purple-950/30 text-purple-400 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    No Onion Garlic
                  </span>
                )}

                {currentItem.is_vegan && (
                  <span className="border border-teal-600/40 bg-teal-950/30 text-teal-400 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    Vegan
                  </span>
                )}
              </div>
            </div>

            <p className="text-slate-400 text-xs max-w-2xl leading-relaxed">
              {currentItem.description || 'Delectably prepared on order with premium local ingredients.'}
            </p>
          </div>

          <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center shrink-0 border-t border-slate-900 md:border-t-0 pt-3 md:pt-0 gap-4">
            <div className="flex flex-col items-start md:items-end gap-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest block">Price</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-emerald-400">₹{currentItem.price.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {currentItem.calories !== undefined && currentItem.calories !== null && (
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    {currentItem.calories} kcal
                  </span>
                )}
                {currentItem.grams !== undefined && currentItem.grams !== null && (
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    {currentItem.calories !== undefined && currentItem.calories !== null ? '•' : ''} {currentItem.grams} gms
                  </span>
                )}
              </div>
            </div>

            {/* Tray Action Controls */}
            {currentItem.is_available && onAddToTray && onRemoveFromTray && (
              <div className="shrink-0">
                {(() => {
                  const tItem = tray.find((t) => t.id === currentItem.id);
                  const qty = tItem ? tItem.quantity : 0;
                  if (qty === 0) {
                    return (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToTray(currentItem.id);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add to Tray</span>
                      </button>
                    );
                  }
                  return (
                    <div className="flex items-center bg-indigo-950/80 border border-indigo-500/30 rounded-xl overflow-hidden shadow-md">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveFromTray(currentItem.id);
                        }}
                        className="px-3 py-2 text-indigo-400 hover:bg-indigo-900/60 transition font-black text-sm cursor-pointer select-none"
                      >
                        -
                      </button>
                      <span className="px-2 text-sm font-black text-indigo-200 w-6 text-center select-none">
                        {qty}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToTray(currentItem.id);
                        }}
                        className="px-3 py-2 text-indigo-400 hover:bg-indigo-900/60 transition font-black text-sm cursor-pointer select-none"
                      >
                        +
                      </button>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
