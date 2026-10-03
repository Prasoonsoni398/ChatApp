import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  BsX,
  BsCheck2,
  BsArrowRepeat,
  BsArrowCounterclockwise,
  BsZoomIn,
} from "react-icons/bs";
import toast from "react-hot-toast";
import getCroppedImg, { rotateSize } from "../../utils/cropImage.js";

const DEFAULT_ASPECT_OPTIONS = [
  { id: "free", label: "Free", value: null },
  { id: "original", label: "Original", value: "original" },
  { id: "1:1", label: "1:1 Square", value: 1 },
  { id: "9:16", label: "9:16 Portrait", value: 9 / 16 },
  { id: "4:5", label: "4:5 Post", value: 4 / 5 },
  { id: "16:9", label: "16:9 Landscape", value: 16 / 9 },
];

/**
 * ImageCropModal / ImageCropView
 * Full-featured WhatsApp-style cropping system with:
 * - Corner & edge draggable handles
 * - Move/pan crop box
 * - 90° clockwise rotation
 * - Reset rotation and zoom
 * - Aspect ratio presets (Free, Original, 1:1, 9:16, 4:5, 16:9)
 * - Round / circular avatar guide overlay
 * - Zoom slider
 * - High-resolution export via canvas getCroppedImg
 */
const ImageCropModal = ({
  isOpen = true,
  imageSrc,
  onCropComplete,
  onCropDone,
  onCancel,
  title = "Crop & Rotate",
  cropShape = "rect",
  initialAspect = "free",
  aspectOptions = DEFAULT_ASPECT_OPTIONS,
}) => {
  const [rotation, setRotation] = useState(0);
  const [selectedAspectId, setSelectedAspectId] = useState(initialAspect);
  const [isProcessing, setIsProcessing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  // Natural image metadata
  const [naturalImage, setNaturalImage] = useState(null);

  // Display dimensions of the photo on screen
  const [dispSize, setDispSize] = useState({ width: 0, height: 0 });

  // Crop rectangle in display coordinates { x, y, width, height }
  const [cropRect, setCropRect] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Container refs
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const dragRef = useRef(null);

  // ── Load image when imageSrc changes ──
  useEffect(() => {
    if (!isOpen || !imageSrc) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setNaturalImage(img);
      setRotation(0);
      setZoom(1);
      setSelectedAspectId(initialAspect);
    };
    img.onerror = () => {
      toast.error("Failed to load image for cropping");
      onCancel?.();
    };
    img.src = imageSrc;
  }, [isOpen, imageSrc, initialAspect, onCancel]);

  // ── Compute display bounds and initial crop rect ──
  const updateLayout = useCallback(
    (rotDeg = rotation, aspectId = selectedAspectId) => {
      if (!naturalImage || !stageRef.current) return;

      const stageW = stageRef.current.clientWidth;
      const stageH = stageRef.current.clientHeight;
      if (stageW < 50 || stageH < 50) return;

      const imgW = naturalImage.naturalWidth || naturalImage.width;
      const imgH = naturalImage.naturalHeight || naturalImage.height;

      const { width: bBoxW, height: bBoxH } = rotateSize(imgW, imgH, rotDeg);

      // Available space with 48px padding
      const maxW = Math.max(100, stageW - 48);
      const maxH = Math.max(100, stageH - 48);

      const scale = Math.min(maxW / bBoxW, maxH / bBoxH);
      const dw = Math.round(bBoxW * scale);
      const dh = Math.round(bBoxH * scale);

      setDispSize({ width: dw, height: dh });

      // Calculate initial crop box based on selected aspect ratio
      const targetRatio =
        aspectId === "original"
          ? bBoxW / bBoxH
          : aspectOptions.find((a) => a.id === aspectId)?.value || null;

      let cw = dw;
      let ch = dh;
      let cx = 0;
      let cy = 0;

      if (targetRatio) {
        if (dw / dh > targetRatio) {
          ch = dh;
          cw = Math.round(dh * targetRatio);
          cx = Math.round((dw - cw) / 2);
          cy = 0;
        } else {
          cw = dw;
          ch = Math.round(dw / targetRatio);
          cx = 0;
          cy = Math.round((dh - ch) / 2);
        }
      }

      setCropRect({ x: cx, y: cy, width: cw, height: ch });
    },
    [naturalImage, rotation, selectedAspectId, aspectOptions],
  );

  // Recalculate when natural image, rotation, or stage size changes
  useEffect(() => {
    updateLayout(rotation, selectedAspectId);

    const handleResize = () => updateLayout(rotation, selectedAspectId);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateLayout, rotation, selectedAspectId]);

  // ── Draw rotated image on display canvas ──
  useEffect(() => {
    if (!naturalImage || !canvasRef.current || dispSize.width === 0) return;

    const canvas = canvasRef.current;
    canvas.width = dispSize.width;
    canvas.height = dispSize.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, dispSize.width, dispSize.height);
    ctx.save();

    // Center & rotate
    ctx.translate(dispSize.width / 2, dispSize.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    const imgW = naturalImage.naturalWidth || naturalImage.width;
    const imgH = naturalImage.naturalHeight || naturalImage.height;
    const { width: bBoxW } = rotateSize(imgW, imgH, rotation);
    const scale = dispSize.width / bBoxW;

    ctx.drawImage(
      naturalImage,
      (-imgW * scale) / 2,
      (-imgH * scale) / 2,
      imgW * scale,
      imgH * scale,
    );

    ctx.restore();
  }, [naturalImage, rotation, dispSize]);

  // ── Handle Aspect Ratio Change ──
  const handleSelectAspect = (aspectId) => {
    setSelectedAspectId(aspectId);
    updateLayout(rotation, aspectId);
  };

  // ── Handle Rotate 90° Clockwise ──
  const handleRotate = () => {
    const nextRot = (rotation + 90) % 360;
    setRotation(nextRot);
    updateLayout(nextRot, selectedAspectId);
  };

  // ── Handle Reset ──
  const handleReset = () => {
    setRotation(0);
    setSelectedAspectId(initialAspect);
    setZoom(1);
    updateLayout(0, initialAspect);
  };

  // ── Pointer Drag Interactions (Smooth Window-Tracked) ──
  const handleStartDrag = (e, handleType) => {
    e.preventDefault();
    e.stopPropagation();

    const opt = aspectOptions.find((a) => a.id === selectedAspectId);
    let targetRatio = null;
    if (selectedAspectId === "original" && naturalImage) {
      const imgW = naturalImage.naturalWidth || naturalImage.width;
      const imgH = naturalImage.naturalHeight || naturalImage.height;
      const { width: bW, height: bH } = rotateSize(imgW, imgH, rotation);
      targetRatio = bW / bH;
    } else if (opt?.value) {
      targetRatio = opt.value;
    }

    dragRef.current = {
      handle: handleType,
      startX: e.clientX,
      startY: e.clientY,
      startRect: { ...cropRect },
      targetRatio,
      dispW: dispSize.width,
      dispH: dispSize.height,
      currentZoom: zoom || 1,
    };

    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const onPointerMove = (e) => {
      if (!dragRef.current) return;
      const {
        handle,
        startX,
        startY,
        startRect,
        targetRatio,
        dispW,
        dispH,
        currentZoom,
      } = dragRef.current;

      const z = currentZoom || 1;
      const dx = (e.clientX - startX) / z;
      const dy = (e.clientY - startY) / z;
      const minSize = 36;

      let { x, y, width, height } = startRect;

      if (handle === "move") {
        x = Math.max(0, Math.min(dispW - width, startRect.x + dx));
        y = Math.max(0, Math.min(dispH - height, startRect.y + dy));
        setCropRect({
          x: Math.round(x),
          y: Math.round(y),
          width: Math.round(width),
          height: Math.round(height),
        });
        return;
      }

      // Free Mode vs Locked Aspect Ratio Mode
      if (!targetRatio) {
        if (handle.includes("r")) {
          width = Math.max(
            minSize,
            Math.min(dispW - startRect.x, startRect.width + dx),
          );
        }
        if (handle.includes("l")) {
          const newX = Math.max(
            0,
            Math.min(startRect.x + startRect.width - minSize, startRect.x + dx),
          );
          width = startRect.width - (newX - startRect.x);
          x = newX;
        }
        if (handle.includes("b")) {
          height = Math.max(
            minSize,
            Math.min(dispH - startRect.y, startRect.height + dy),
          );
        }
        if (handle.includes("t")) {
          const newY = Math.max(
            0,
            Math.min(
              startRect.y + startRect.height - minSize,
              startRect.y + dy,
            ),
          );
          height = startRect.height - (newY - startRect.y);
          y = newY;
        }
      } else {
        const ar = targetRatio;

        if (handle === "br") {
          let rawW = startRect.width + dx;
          let rawH = rawW / ar;
          if (startRect.x + rawW > dispW) {
            rawW = dispW - startRect.x;
            rawH = rawW / ar;
          }
          if (startRect.y + rawH > dispH) {
            rawH = dispH - startRect.y;
            rawW = rawH * ar;
          }
          width = Math.max(minSize, rawW);
          height = Math.max(minSize / ar, rawH);
        } else if (handle === "tr") {
          let rawW = startRect.width + dx;
          let rawH = rawW / ar;
          let newY = startRect.y + startRect.height - rawH;
          if (newY < 0) {
            newY = 0;
            rawH = startRect.y + startRect.height;
            rawW = rawH * ar;
          }
          if (startRect.x + rawW > dispW) {
            rawW = dispW - startRect.x;
            rawH = rawW / ar;
            newY = startRect.y + startRect.height - rawH;
          }
          y = Math.max(0, newY);
          width = Math.max(minSize, rawW);
          height = Math.max(minSize / ar, rawH);
        } else if (handle === "bl") {
          let rawH = startRect.height + dy;
          let rawW = rawH * ar;
          let newX = startRect.x + startRect.width - rawW;
          if (newX < 0) {
            newX = 0;
            rawW = startRect.x + startRect.width;
            rawH = rawW / ar;
          }
          if (startRect.y + rawH > dispH) {
            rawH = dispH - startRect.y;
            rawW = rawH * ar;
            newX = startRect.x + startRect.width - rawW;
          }
          x = Math.max(0, newX);
          width = Math.max(minSize, rawW);
          height = Math.max(minSize / ar, rawH);
        } else if (handle === "tl") {
          let rawW = startRect.width - dx;
          let rawH = rawW / ar;
          let newX = startRect.x + startRect.width - rawW;
          let newY = startRect.y + startRect.height - rawH;
          if (newX < 0) {
            newX = 0;
            rawW = startRect.x + startRect.width;
            rawH = rawW / ar;
            newY = startRect.y + startRect.height - rawH;
          }
          if (newY < 0) {
            newY = 0;
            rawH = startRect.y + startRect.height;
            rawW = rawH * ar;
            newX = startRect.x + startRect.width - rawW;
          }
          x = Math.max(0, newX);
          y = Math.max(0, newY);
          width = Math.max(minSize, rawW);
          height = Math.max(minSize / ar, rawH);
        } else if (handle === "r" || handle === "l") {
          let rawW = Math.max(
            minSize,
            Math.min(dispW - startRect.x, startRect.width + dx),
          );
          let rawH = rawW / ar;
          if (startRect.y + rawH > dispH) {
            rawH = dispH - startRect.y;
            rawW = rawH * ar;
          }
          width = rawW;
          height = rawH;
        } else if (handle === "t" || handle === "b") {
          let rawH = Math.max(
            minSize,
            Math.min(dispH - startRect.y, startRect.height + dy),
          );
          let rawW = rawH * ar;
          if (startRect.x + rawW > dispW) {
            rawW = dispW - startRect.x;
            rawH = rawW / ar;
          }
          width = rawW;
          height = rawH;
        }
      }

      setCropRect({
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(width),
        height: Math.round(height),
      });
    };

    const onPointerUp = () => {
      dragRef.current = null;
      setIsDragging(false);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [isDragging]);

  // Keyboard shortcut listener (Escape to cancel)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !isProcessing) {
        onCancel?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isProcessing, onCancel]);

  // ── Apply Crop & Export ──
  const handleApplyCrop = async () => {
    if (!naturalImage || dispSize.width === 0) {
      onCancel?.();
      return;
    }

    try {
      setIsProcessing(true);

      const imgW = naturalImage.naturalWidth || naturalImage.width;
      const imgH = naturalImage.naturalHeight || naturalImage.height;
      const { width: bBoxW, height: bBoxH } = rotateSize(imgW, imgH, rotation);

      // Scale factor between screen display pixels and natural rotated bounding box
      const scale = bBoxW / dispSize.width;

      const pixelCrop = {
        x: Math.max(0, Math.min(bBoxW - 1, Math.round(cropRect.x * scale))),
        y: Math.max(0, Math.min(bBoxH - 1, Math.round(cropRect.y * scale))),
        width: Math.max(1, Math.min(bBoxW, Math.round(cropRect.width * scale))),
        height: Math.max(
          1,
          Math.min(bBoxH, Math.round(cropRect.height * scale)),
        ),
      };

      const croppedBlob = await getCroppedImg(imageSrc, pixelCrop, rotation);

      if (!croppedBlob) {
        toast.error("Failed to crop image");
        return;
      }

      const croppedFile = new File([croppedBlob], `crop_${Date.now()}.jpg`, {
        type: "image/jpeg",
        lastModified: Date.now(),
      });
      const croppedUrl = URL.createObjectURL(croppedBlob);

      onCropComplete?.(croppedFile, croppedUrl);
      onCropDone?.(croppedFile, croppedUrl);
    } catch (err) {
      console.error("Error cropping image:", err);
      toast.error("Error applying crop");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[10005] bg-[#0B141A] flex flex-col justify-between overflow-hidden text-white select-none animate-fade-in">
      {/* ── TOP HEADER ── */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-white/10 bg-[#0B141A]/95 backdrop-blur-md z-30 flex-shrink-0">
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Cancel"
        >
          <BsX size={28} />
        </button>

        <h3 className="font-semibold text-base tracking-wide text-white">
          {title}
        </h3>

        <button
          type="button"
          onClick={handleReset}
          disabled={isProcessing}
          className="text-xs font-medium text-white/80 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
        >
          <BsArrowCounterclockwise size={14} />
          <span>Reset</span>
        </button>
      </div>

      {/* ── MAIN CROP STAGE ── */}
      <div
        ref={stageRef}
        className="flex-1 relative w-full h-full bg-[#080E12] flex items-center justify-center overflow-hidden p-4 touch-none"
      >
        {dispSize.width > 0 && (
          <div
            className="relative select-none shadow-2xl"
            style={{
              width: dispSize.width,
              height: dispSize.height,
              transform: `scale(${zoom})`,
              transition: isDragging ? "none" : "transform 0.15s ease-out",
            }}
          >
            {/* Base Rotated Preview Canvas */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 block pointer-events-none rounded-sm"
              style={{ width: dispSize.width, height: dispSize.height }}
            />

            {/* ── 4 DARK OVERLAY MASKS OUTSIDE CROP FRAME ── */}
            {/* Top Mask */}
            <div
              className="absolute bg-black/75 pointer-events-none"
              style={{
                top: 0,
                left: 0,
                right: 0,
                height: Math.max(0, cropRect.y),
              }}
            />
            {/* Bottom Mask */}
            <div
              className="absolute bg-black/75 pointer-events-none"
              style={{
                top: Math.max(0, cropRect.y + cropRect.height),
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
            {/* Left Mask */}
            <div
              className="absolute bg-black/75 pointer-events-none"
              style={{
                top: Math.max(0, cropRect.y),
                left: 0,
                width: Math.max(0, cropRect.x),
                height: Math.max(0, cropRect.height),
              }}
            />
            {/* Right Mask */}
            <div
              className="absolute bg-black/75 pointer-events-none"
              style={{
                top: Math.max(0, cropRect.y),
                left: Math.max(0, cropRect.x + cropRect.width),
                right: 0,
                height: Math.max(0, cropRect.height),
              }}
            />

            {/* ── GuftguCROP FRAME ── */}
            <div
              className="absolute border border-white/80 select-none shadow-sm cursor-move touch-none"
              style={{
                left: cropRect.x,
                top: cropRect.y,
                width: cropRect.width,
                height: cropRect.height,
              }}
              onPointerDown={(e) => handleStartDrag(e, "move")}
            >
              {/* Circular guide overlay for avatars */}
              {cropShape === "round" && (
                <div className="absolute inset-0 rounded-full border border-white/40 pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.2)]" />
              )}

              {/* Rule of Thirds Grid Lines */}
              <div className="absolute top-0 bottom-0 left-1/3 w-px bg-white/30 pointer-events-none" />
              <div className="absolute top-0 bottom-0 left-2/3 w-px bg-white/30 pointer-events-none" />
              <div className="absolute left-0 right-0 top-1/3 h-px bg-white/30 pointer-events-none" />
              <div className="absolute left-0 right-0 top-2/3 h-px bg-white/30 pointer-events-none" />

              {/* ── 4 CORNER BRACKETS ── */}
              {/* Top-Left */}
              <div
                onPointerDown={(e) => handleStartDrag(e, "tl")}
                className="absolute -top-3.5 -left-3.5 w-8 h-8 cursor-nwse-resize flex items-start justify-start p-1.5 touch-none z-30"
              >
                <div className="w-5 h-5 border-t-[3.5px] border-l-[3.5px] border-white pointer-events-none drop-shadow-md" />
              </div>

              {/* Top-Right */}
              <div
                onPointerDown={(e) => handleStartDrag(e, "tr")}
                className="absolute -top-3.5 -right-3.5 w-8 h-8 cursor-nesw-resize flex items-start justify-end p-1.5 touch-none z-30"
              >
                <div className="w-5 h-5 border-t-[3.5px] border-r-[3.5px] border-white pointer-events-none drop-shadow-md" />
              </div>

              {/* Bottom-Left */}
              <div
                onPointerDown={(e) => handleStartDrag(e, "bl")}
                className="absolute -bottom-3.5 -left-3.5 w-8 h-8 cursor-nesw-resize flex items-end justify-start p-1.5 touch-none z-30"
              >
                <div className="w-5 h-5 border-b-[3.5px] border-l-[3.5px] border-white pointer-events-none drop-shadow-md" />
              </div>

              {/* Bottom-Right */}
              <div
                onPointerDown={(e) => handleStartDrag(e, "br")}
                className="absolute -bottom-3.5 -right-3.5 w-8 h-8 cursor-nwse-resize flex items-end justify-end p-1.5 touch-none z-30"
              >
                <div className="w-5 h-5 border-b-[3.5px] border-r-[3.5px] border-white pointer-events-none drop-shadow-md" />
              </div>

              {/* ── 4 EDGE HANDLES ── */}
              {/* Top Edge */}
              <div
                onPointerDown={(e) => handleStartDrag(e, "t")}
                className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-6 cursor-ns-resize flex items-center justify-center touch-none z-30"
              >
                <div className="w-6 h-1 bg-white rounded-full drop-shadow-md" />
              </div>
              {/* Bottom Edge */}
              <div
                onPointerDown={(e) => handleStartDrag(e, "b")}
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-12 h-6 cursor-ns-resize flex items-center justify-center touch-none z-30"
              >
                <div className="w-6 h-1 bg-white rounded-full drop-shadow-md" />
              </div>
              {/* Left Edge */}
              <div
                onPointerDown={(e) => handleStartDrag(e, "l")}
                className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-12 cursor-ew-resize flex items-center justify-center touch-none z-30"
              >
                <div className="w-1 h-6 bg-white rounded-full drop-shadow-md" />
              </div>
              {/* Right Edge */}
              <div
                onPointerDown={(e) => handleStartDrag(e, "r")}
                className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 cursor-ew-resize flex items-center justify-center touch-none z-30"
              >
                <div className="w-1 h-6 bg-white rounded-full drop-shadow-md" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── BOTTOM CONTROLS ── */}
      <div className="border-t border-white/10 bg-[#0B141A]/95 backdrop-blur-md px-4 py-3 flex flex-col gap-3 z-30 flex-shrink-0">
        {/* Zoom Slider */}
        <div className="flex items-center gap-3 max-w-sm mx-auto w-full px-2">
          <BsZoomIn size={14} className="text-white/60 flex-shrink-0" />
          <input
            type="range"
            min="0.8"
            max="2.5"
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#25D366]"
          />
          <span className="text-[11px] font-mono text-white/50 w-8 text-right">
            {Math.round(zoom * 100)}%
          </span>
        </div>

        {/* Aspect Ratio Chips & Rotate & Done Action */}
        <div className="flex items-center justify-between gap-2 max-w-xl mx-auto w-full">
          {/* Rotate 90 Button */}
          <button
            type="button"
            onClick={handleRotate}
            disabled={isProcessing}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer flex-shrink-0 active:scale-95"
            title="Rotate 90°"
          >
            <BsArrowRepeat size={20} />
          </button>

          {/* Aspect Ratio Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-1 scrollbar-none flex-1 justify-center">
            {aspectOptions.map((opt) => {
              const isSelected = selectedAspectId === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectAspect(opt.id)}
                  disabled={isProcessing}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#25D366] text-[#0B141A] font-semibold shadow-md"
                      : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Apply / Done Checkmark Button */}
          <button
            type="button"
            onClick={handleApplyCrop}
            disabled={isProcessing}
            className="h-10 px-4 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-[#0B141A] font-bold text-sm flex items-center gap-1.5 transition-all shadow-lg active:scale-95 cursor-pointer flex-shrink-0 disabled:opacity-50"
            title="Done"
          >
            {isProcessing ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <>
                <BsCheck2 size={20} />
                <span className="hidden sm:inline">Done</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : modalContent;
};

export default ImageCropModal;
export { ImageCropModal as ImageCropView };
