import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { BsX } from "react-icons/bs";
import getCroppedImg from "../../utils/cropImage.js";
import {} from "../../constants/styles.js";

const ImageCropView = ({ imageSrc, onCropComplete, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);

  const onCropCompleteCallback = useCallback(
    (croppedArea, croppedAreaPixels) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const handleSave = async () => {
    try {
      setIsCropping(true);
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      // Create a File object from the blob
      const croppedFile = new File([croppedImageBlob], "avatar.jpg", {
        type: "image/jpeg",
      });
      onCropComplete(croppedFile);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCropping(false);
    }
  };

  if (!imageSrc) return null;

  return (
    <div className="flex flex-col w-full h-full overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between border-b border-base-300">
        <h3 className="font-bold text-lg">Crop Image</h3>
        <button
          onClick={onCancel}
          className="w-8 h-8 rounded-full flex items-center justify-center text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors cursor-pointer"
        >
          <BsX size={20} />
        </button>
      </div>

      <div className="relative w-full h-100 bg-base-300">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onCropComplete={onCropCompleteCallback}
          onZoomChange={setZoom}
        />
      </div>

      <div className="p-4 bg-base-100 flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-base-content/70">Zoom</span>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => {
              setZoom(e.target.value);
            }}
            className="range range-xs range-primary flex-1"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="btn btn-ghost flex-1 active:scale-95 transition-transform"
            disabled={isCropping}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn btn-primary flex-1 active:scale-95 transition-transform"
            disabled={isCropping}
          >
            {isCropping ? "Saving..." : "Apply"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropView;
