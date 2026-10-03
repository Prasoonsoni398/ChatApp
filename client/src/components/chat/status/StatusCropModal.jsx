import ImageCropModal from "../ImageCropModal.jsx";

const STATUS_ASPECT_OPTIONS = [
  { id: "free", label: "Free", value: null },
  { id: "original", label: "Original", value: "original" },
  { id: "1:1", label: "1:1 Square", value: 1 },
  { id: "9:16", label: "9:16 Status", value: 9 / 16 },
  { id: "4:5", label: "4:5 Portrait", value: 4 / 5 },
  { id: "16:9", label: "16:9 Landscape", value: 16 / 9 },
];

/**
 * GuftguStatus Crop & Rotate Modal
 * Reuses the high-precision ImageCropModal with GuftguStatus 9:16 presets.
 */
const StatusCropModal = ({ isOpen, imageSrc, onCropDone, onCancel }) => {
  return (
    <ImageCropModal
      isOpen={isOpen}
      imageSrc={imageSrc}
      onCropDone={onCropDone}
      onCancel={onCancel}
      title="Crop & Rotate"
      cropShape="rect"
      initialAspect="free"
      aspectOptions={STATUS_ASPECT_OPTIONS}
    />
  );
};

export default StatusCropModal;
