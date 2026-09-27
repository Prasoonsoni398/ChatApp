const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
      image.crossOrigin = "anonymous";
    }
    image.src = url;
  });

function getRadianAngle(degreeValue) {
  return (degreeValue * Math.PI) / 180;
}

export function rotateSize(width, height, rotation) {
  const rotRad = getRadianAngle(rotation);
  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

/**
 * Crop and rotate image to produce a high-quality JPEG Blob
 */
export default async function getCroppedImg(
  imageSrc,
  pixelCrop,
  rotation = 0,
  flip = { horizontal: false, vertical: false },
) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return null;
  }

  const rotRad = getRadianAngle(rotation);

  const imgW = image.naturalWidth || image.width;
  const imgH = image.naturalHeight || image.height;

  // Calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    imgW,
    imgH,
    rotation,
  );

  canvas.width = Math.round(bBoxWidth);
  canvas.height = Math.round(bBoxHeight);

  // Center rotation
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(rotRad);
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
  ctx.translate(-imgW / 2, -imgH / 2);

  ctx.drawImage(image, 0, 0);

  const croppedCanvas = document.createElement("canvas");
  const croppedCtx = croppedCanvas.getContext("2d");

  if (!croppedCtx) {
    return null;
  }

  const targetW = Math.max(1, Math.round(pixelCrop.width));
  const targetH = Math.max(1, Math.round(pixelCrop.height));
  const srcX = Math.max(0, Math.min(canvas.width - 1, Math.round(pixelCrop.x)));
  const srcY = Math.max(
    0,
    Math.min(canvas.height - 1, Math.round(pixelCrop.y)),
  );
  const srcW = Math.min(targetW, canvas.width - srcX);
  const srcH = Math.min(targetH, canvas.height - srcY);

  croppedCanvas.width = targetW;
  croppedCanvas.height = targetH;

  croppedCtx.drawImage(canvas, srcX, srcY, srcW, srcH, 0, 0, targetW, targetH);

  return new Promise((resolve, reject) => {
    croppedCanvas.toBlob(
      (file) => {
        if (!file) {
          reject(new Error("Canvas is empty"));
          return;
        }
        resolve(file);
      },
      "image/jpeg",
      0.95,
    );
  });
}
