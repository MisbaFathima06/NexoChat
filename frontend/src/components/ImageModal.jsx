import { X, Download, ExternalLink } from "lucide-react";
import { useState } from "react";

const ImageModal = ({ imageUrl, fileName, onClose, onNext, onPrevious, hasNext, hasPrevious }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || `image-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download image:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOpenInNewTab = () => {
    window.open(imageUrl, "_blank");
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 btn btn-circle btn-ghost bg-base-100/90 hover:bg-base-100 z-10"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Navigation Buttons */}
        {hasPrevious && (
          <button
            onClick={onPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 btn btn-circle btn-ghost bg-base-100/90 hover:bg-base-100 z-10"
            aria-label="Previous image"
          >
            <span className="text-2xl">‹</span>
          </button>
        )}
        {hasNext && (
          <button
            onClick={onNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 btn btn-circle btn-ghost bg-base-100/90 hover:bg-base-100 z-10"
            aria-label="Next image"
          >
            <span className="text-2xl">›</span>
          </button>
        )}

        {/* Image */}
        <img
          src={imageUrl}
          alt={fileName || "Image"}
          className="max-w-full max-h-full object-contain rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />

        {/* Action Buttons */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="btn btn-primary gap-2"
            title="Download image"
          >
            <Download className="w-4 h-4" />
            {isDownloading ? "Downloading..." : "Download"}
          </button>
          <button
            onClick={handleOpenInNewTab}
            className="btn btn-ghost bg-base-100/90 hover:bg-base-100 gap-2"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
            Open
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;

