
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploaderProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  accept: string;
  title: string;
}

export const FileUploader = ({ onFileSelect, selectedFile, accept, title }: FileUploaderProps) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/html': ['.html', '.htm'],
    },
    maxFiles: 1,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
        isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
        selectedFile && "border-green-500 bg-green-50"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center space-y-2">
        {selectedFile ? (
          <>
            <File className="h-8 w-8 text-green-600" />
            <p className="text-sm font-medium text-green-600">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">{title}</p>
            <p className="text-xs text-muted-foreground">
              Or click to select file
            </p>
          </>
        )}
      </div>
    </div>
  );
};
