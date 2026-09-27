import { useState, useEffect, useRef, useCallback } from "react";
import {
  BsX,
  BsCheck2,
  BsArrowRepeat,
  BsArrowCounterclockwise,
  BsZoomIn,
} from "react-icons/bs";
import toast from "react-hot-toast";
import getCroppedImg, { rotateSize } from "../../../utils/cropImage.js";

const ASPECT_OPTIONS = [
  { id: "free", label: "Free", value: null },
  { id: "original", label: "Original", value: "original" },
  { id: "1:1", label: "1:1 Square", value: 1 },
  { id: "9:16", label: "9:16 Status", value: 9 / 16 },
  { id: "4:5", label: "4:5 Portrait", value: 4 / 5 },
  { id: "16:9", label: "16:9 Landscape", value: 16 / 9 },
];

const StatusCropModal = ({ isOpen, imageSrc, onCropDone, onCancel }) => {
  const [rotation, setRotation] = useState(0);
  const [selectedAspectId, setSelectedAspectId] = useState("free");
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

  // Active drag tracking
  const dragRef = useRef(null);

  // ── Load image when imageSrc changes or modal opens ──
  useEffect(() => {
    if (!isOpen || !imageSrc) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setNaturalImage(img);
      setRotation(0);
      setZoom(1);
      setSelectedAspectId("free");
    };
    img.onerror = () => {
      toast.error("Failed to load image for cropping");
      onCancel();
    };
    img.src = imageSrc;
  }, [isOpen, imageSrc, onCancel]);

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

      // Available space with 32px padding
      const maxW = Math.max(100, stageW - 48);
      const maxH = Math.max(100, stageH - 48);

      const scale = Math.min(maxW / bBoxW, maxH / bBoxH);
      const dw = Math.round(bBoxW * scale);
      const dh = Math.round(bBoxH * scale);

      setDispSize({ width: dw, height: dh });

      // Calculate initial crop box based on selected aspect ratio
      let targetRatio = null;
      if (aspectId === "original") {
        targetRatio = bBoxW / bBoxH;
      } else {
        const opt = ASPECT_OPTIONS.find((a) => a.id === aspectId);
        targetRatio = opt?.value || null;
      }

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
    [naturalImage, rotation, selectedAspectId],
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
    const { width: bBoxW, height: bBoxH } = rotateSize(imgW, imgH, rotation);
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
    setSelectedAspectId("free");
    setZoom(1);
    updateLayout(0, "free");
  };

  // ── Pointer Drag Interactions (Corner, Edge, Move) ──
  const handleStartDrag = (e, handleType) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      e.target.setPointerCapture(e.pointerId);
    } catch {
      // In case setPointerCapture is unsupported or failed
    }

    setIsDragging(true);

    const opt = ASPECT_OPTIONS.find((a) => a.id === selectedAspectId);
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
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startRect: { ...cropRect },
      targetRatio,
      dispW: dispSize.width,
      dispH: dispSize.height,
    };
  };

  const handlePointerMove = (e) => {
    if (!dragRef.current) return;
    const { handle, startX, startY, startRect, targetRatio, dispW, dispH } =
      dragRef.current;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const minSize = 40;

    let { x, y, width, height } = startRect;

    if (handle === "move") {
      x = Math.max(0, Math.min(dispW - width, startRect.x + dx));
      y = Math.max(0, Math.min(dispH - height, startRect.y + dy));
      setCropRect({ x, y, width, height });
      return;
    }

    // Aspect locked vs Free handling
    if (!targetRatio) {
      // ── FREE MODE ──
      if (handle.includes("r")) {
        width = Math.max(minSize, Math.min(dispW - startRect.x, startRect.width + dx));
      }
      if (handle.includes("l")) {
        const newX = Math.max(0, Math.min(startRect.x + startRect.width - minSize, startRect.x + dx));
        width = startRect.width - (newX - startRect.x);
        x = newX;
      }
      if (handle.includes("b")) {
        height = Math.max(minSize, Math.min(dispH - startRect.y, startRect.height + dy));
      }
      if (handle.includes("t")) {
        const newY = Math.max(0, Math.min(startRect.y + startRect.height - minSize, startRect.y + dy));
        height = startRect.height - (newY - startRect.y);
        y = newY;
      }
    } else {
      // ── LOCKED ASPECT RATIO MODE ──
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
      } else if (handle === "r") {
        let rawW = Math.max(minSize, Math.min(dispW - startRect.x, startRect.width + dx));
        let rawH = rawW / ar;
        if (startRect.y + rawH > dispH) {
          rawH = dispH - startRect.y;
          rawW = rawH * ar;
        }
        width = rawW;
        height = rawH;
      } else if (handle === "b") {
        let rawH = Math.max(minSize, Math.min(dispH - startRect.y, startRect.height + dy));
        let rawW = rawH * ar;
        if (startRect.x + rawW > dispW) {
          rawW = dispW - startRect.x;
          rawH = rawW / ar;
        }
        width = rawW;
        height = rawH;
      } else if (handle === "l") {
        let newX = Math.max(0, Math.min(startRect.x + startRect.width - minSize, startRect.x + dx));
        let rawW = startRect.width - (newX - startRect.x);
        let rawH = rawW / ar;
        if (startRect.y + rawH > dispH) {
          rawH = dispH - startRect.y;
          rawW = rawH * ar;
          newX = startRect.x + startRect.width - rawW;
        }
        x = newX;
        width = rawW;
        height = rawH;
      } else if (handle === "t") {
        let newY = Math.max(0, Math.min(startRect.y + startRect.height - minSize, startRect.y + dy));
        let rawH = startRect.height - (newY - startRect.y);
        let rawW = rawH * ar;
        if (startRect.x + rawW > dispW) {
          rawW = dispW - startRect.x;
          rawH = rawW / ar;
          newY = startRect.y + startRect.height - rawH;
        }
        y = newY;
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

  const handlePointerUp = (e) => {
    if (dragRef.current) {
      try {
        e.target.releasePointerCapture(e.pointerId);
      } catch {
        // Safe catch
      }
      dragRef.current = null;
    }
    setIsDragging(false);
  };

  // ── Apply Crop & Export ──
  const handleApplyCrop = async () => {
    if (!naturalImage || dispSize.width === 0) {
      onCancel();
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
        height: Math.max(1, Math.min(bBoxH, Math.round(cropRect.height * scale))),
      };

      const croppedBlob = await getCroppedImg(imageSrc, pixelCrop, rotation);

      if (!croppedBlob) {
        toast.error("Failed to crop image");
        return;
      }

      const croppedFile = new File([croppedBlob], `status_crop_${Date.now()}.jpg`, {
        type: "image/jpeg",
        lastModified: Date.now(),
      });
      const croppedUrl = URL.createObjectURL(croppedBlob);

      onCropDone(croppedFile, croppedUrl);
    } catch (err) {
      console.error("Error cropping image:", err);
      toast.error("Error applying crop");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div
      className="fixed inset-0 z-10005 bg-[#0B141A] flex flex-col justify-between overflow-hidden text-white select-none animate-fade-in"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* ── TOP HEADER ── */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-white/10 bg-[#0B141A]/95 backdrop-blur-md z-30">
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
          Crop & Rotate
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

      {/* ── MAIN CROP STAGE (WHATSAPP VIEWPORT) ── */}
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

            {/* ── WHATSAPP CROP FRAME ── */}
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
              {/* Rule of Thirds Grid Lines */}
              <div className="absolute top-0 bottom-0 left-1/3 w-px bg-white/30 pointer-events-none" />
              <div className="absolute top-0 bottom-0 left-2/3 w-px bg-white/30 pointer-events-none" />
              <div className="absolute left-0 right-0 top-1/3 h-px bg-white/30 pointer-events-none" />
              <div className="absolute left-0 right-0 top-2/3 h-px bg-white/30 pointer-events-none" />

              {/* ── 4 WHATSAPP SOLID CORNER BRACKETS ── */}
              {/* Top-Left Corner */}
              <div
                onPointerDown={(e) => handleStartDrag(e, "tl")}
                className="absolute -top-3.5 -left-3.5 w-8 h-8 cursor-nwse-resize flex items-start justify-start p-1.5 touch-none z-30"
              >
                <div className="w-5 h-5 border-t-[3.5px] border-l-[3.5px] border-white pointer-events-none drop-shadow-md" />
              </div>

              {/* Top-Right Corner */}
              <div
                onPointerDown={(e) => handleStartDrag(e, "tr")}
                className="absolute -top-3.5 -right-3.5 w-8 h-8 cursor-nesw-resize flex items-start justify-end p-1.5 touch-none z-30"
              >
                <div className="w-5 h-5 border-t-[3.5px] border-r-[3.5px] border-white pointer-events-none drop-shadow-md" />
              </div>

              {/* Bottom-Left Corner */}
              <div
                onPointerDown={(e) => handleStartDrag(e, "bl")}
                className="absolute -bottom-3.5 -left-3.5 w-8 h-8 cursor-nesw-resize flex items-end justify-start p-1.5 touch-none z-30"
              >
                <div className="w-5 h-5 border-b-[3.5px] border-l-[3.5px] border-white pointer-events-none drop-shadow-md" />
              </div>

              {/* Bottom-Right Corner */}
              <div
                onPointerDown={(e) => handleStartDrag(e, "br")}
                className="absolute -bottom-3.5 -right-3.5 w-8 h-8 cursor-nwse-resize flex items-end justify-end p-1.5 touch-none z-30"
              >
                <div className="w-5 h-5 border-b-[3.5px] border-r-[3.5px] border-white pointer-events-none drop-shadow-md" />
              </div>

              {/* ── 4 WHATSAPP MIDPOINT EDGE HANDLES ── */}
              {/* Top Edge */}
              <div
                onPointerDown={(e) => handleStartDrag(e, "t")}
                className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-6 cursor-ns-resize flex items-start justify-center pt-1.5 touch-none z-20"
              >
                <div className="w-6 h-[3.5px] bg-white rounded-full pointer-events-none drop-shadow-md" />
              </div>

              {/* Bottom Edge */}
              <div
                onPointerDown={(e) => handleStartDrag(e, "b")}
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-12 h-6 cursor-ns-resize flex items-end justify-center pb-1.5 touch-none z-20"
              >
                <div className="w-6 h-[3.5px] bg-white rounded-full pointer-events-none drop-shadow-md" />
              </div>

              {/* Left Edge */}
              <div
                onPointerDown={(e) => handleStartDrag(e, "l")}
                className="absolute -left-3 top-1/2 -translate-y-1/2 h-12 w-6 cursor-ew-resize flex items-center justify-start pl-1.5 touch-none z-20"
              >
                <div className="h-6 w-[3.5px] bg-white rounded-full pointer-events-none drop-shadow-md" />
              </div>

              {/* Right Edge */}
              <div
                onPointerDown={(e) => handleStartDrag(e, "r")}
                className="absolute -right-3 top-1/2 -translate-y-1/2 h-12 w-6 cursor-ew-resize flex items-center justify-end pr-1.5 touch-none z-20"
              >
                <div className="h-6 w-[3.5px] bg-white rounded-full pointer-events-none drop-shadow-md" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── BOTTOM CONTROLS (ASPECT RATIOS, ROTATION, ZOOM, DONE) ── */}
      <div className="bg-[#0B141A]/95 backdrop-blur-md border-t border-white/10 px-4 py-3 space-y-3 z-30">
        {/* Aspect Ratio Selector Chips */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {ASPECT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleSelectAspect(opt.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedAspectId === opt.id
                  ? "bg-[#25D366] text-black font-semibold shadow-md shadow-[#25D366]/20 scale-105"
                  : "bg-white/10 hover:bg-white/20 text-white/80"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Action Row: Rotate, Zoom, WhatsApp Done Button */}
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3 pt-1">
          {/* 90° Rotate Clockwise */}
          <button
            type="button"
            onClick={handleRotate}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all active:scale-95 cursor-pointer flex-shrink-0"
            title="Rotate 90 degrees clockwise"
          >
            <BsArrowRepeat size={16} />
            <span>{rotation}°</span>
          </button>

          {/* Zoom Slider */}
          <div className="flex items-center gap-2 flex-1 max-w-[200px] sm:max-w-xs">
            <BsZoomIn size={14} className="text-white/60 flex-shrink-0" />
            <input
              type="range"
              min={1}
              max={2.5}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="range range-xs range-primary flex-1 accent-[#25D366]"
            />
            <span className="text-[11px] font-mono text-white/60 w-8 text-right">
              {zoom.toFixed(1)}x
            </span>
          </div>

          {/* WhatsApp Green Done Button */}
          <button
            type="button"
            onClick={handleApplyCrop}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-6 py-2 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-black font-bold text-sm shadow-lg shadow-[#25D366]/25 transition-all active:scale-95 cursor-pointer flex-shrink-0"
          >
            {isProcessing ? (
              <span className="loading loading-spinner loading-xs text-black" />
            ) : (
              <>
                <BsCheck2 size={18} className="stroke-[1.5]" />
                <span>Done</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusCropModal;
