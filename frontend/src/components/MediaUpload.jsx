import { useState, useRef } from "react";
import { Image, Video, File, X } from "lucide-react";

const MediaUpload = ({ onFileSelect, onClose }) => {
  const [preview, setPreview] = useState(null);
  const [fileType, setFileType] = useState(null);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const docInputRef = useRef(null);

  const handleFileSelect = (file, type) => {
    if (!file) return;

    setFileType(type);

    if (type === "image") {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview({ type: "image", url: reader.result });
      };
      reader.readAsDataURL(file);
    } else if (type === "video") {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview({ type: "video", url: reader.result, file });
      };
      reader.readAsDataURL(file);
    } else if (type === "document") {
      setPreview({
        type: "document",
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        file,
      });
    }
  };

  const handleSend = () => {
    if (preview) {
      if (preview.type === "image") {
        onFileSelect({ type: "image", data: preview.url });
      } else if (preview.type === "video") {
        const reader = new FileReader();
        reader.onloadend = () => {
          onFileSelect({ type: "video", data: reader.result });
        };
        reader.readAsDataURL(preview.file);
      } else if (preview.type === "document") {
        const reader = new FileReader();
        reader.onloadend = () => {
          onFileSelect({
            type: "document",
            url: reader.result,
            fileName: preview.fileName,
            fileSize: preview.fileSize,
            mimeType: preview.mimeType,
          });
        };
        reader.readAsDataURL(preview.file);
      }
      setPreview(null);
      onClose();
    }
  };

  return (
    <div className="p-4 bg-base-200 rounded-lg space-y-3">
      {!preview ? (
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-ghost flex flex-col gap-2 h-20"
          >
            <Image className="w-6 h-6" />
            <span className="text-xs">Image</span>
          </button>
          <button
            onClick={() => videoInputRef.current?.click()}
            className="btn btn-ghost flex flex-col gap-2 h-20"
          >
            <Video className="w-6 h-6" />
            <span className="text-xs">Video</span>
          </button>
          <button
            onClick={() => docInputRef.current?.click()}
            className="btn btn-ghost flex flex-col gap-2 h-20"
          >
            <File className="w-6 h-6" />
            <span className="text-xs">Document</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {preview.type === "image" && (
            <img src={preview.url} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
          )}
          {preview.type === "video" && (
            <video src={preview.url} controls className="w-full h-48 rounded-lg" />
          )}
          {preview.type === "document" && (
            <div className="p-4 bg-base-100 rounded-lg">
              <File className="w-8 h-8 mb-2" />
              <div className="font-medium">{preview.fileName}</div>
              <div className="text-sm text-base-content/60">
                {(preview.fileSize / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={handleSend} className="btn btn-sm btn-primary flex-1">
              Send
            </button>
            <button
              onClick={() => setPreview(null)}
              className="btn btn-sm btn-ghost"
            >
              Change
            </button>
          </div>
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files[0], "image")}
      />
      <input
        type="file"
        accept="video/*"
        ref={videoInputRef}
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files[0], "video")}
      />
      <input
        type="file"
        ref={docInputRef}
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files[0], "document")}
      />

      {onClose && (
        <button onClick={onClose} className="btn btn-sm btn-ghost w-full">
          Cancel
        </button>
      )}
    </div>
  );
};

export default MediaUpload;

