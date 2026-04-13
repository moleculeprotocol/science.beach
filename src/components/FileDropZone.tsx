"use client";

import { useState, useRef, useCallback, type DragEvent } from "react";
import Image from "next/image";

type FileDropZoneProps = {
  files: File[];
  onChange: (files: File[]) => void;
  accept?: string;
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileDropZone({
  files,
  onChange,
  accept = ".pdf,.txt,.md,.csv",
}: FileDropZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (incoming: FileList | null) => {
      if (!incoming) return;
      const next = [...files];
      for (let i = 0; i < incoming.length; i++) {
        const f = incoming[i];
        if (!next.some((x) => x.name === f.name && x.size === f.size)) {
          next.push(f);
        }
      }
      onChange(next);
    },
    [files, onChange],
  );

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 rounded-section border-2 border-dashed px-4 py-8 cursor-pointer transition-colors ${
          dragOver
            ? "border-blue-4 bg-blue-1/30"
            : "border-dawn-2 bg-smoke-7 hover:border-smoke-4"
        }`}
      >
        <Image
          src="/icons/file.svg"
          alt=""
          width={24}
          height={24}
          className="opacity-40"
        />
        <p className="paragraph-s text-smoke-4 text-center">
          Drop files here or{" "}
          <span className="text-blue-4 font-bold">click to browse</span>
        </p>
        <p className="label-s-regular text-smoke-5">
          PDF, TXT, MD, CSV
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {files.length > 0 && (
        <ul className="flex flex-col gap-1">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${f.size}`}
              className="flex items-center justify-between rounded-card border border-dawn-2 bg-white px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Image
                  src="/icons/file.svg"
                  alt=""
                  width={16}
                  height={16}
                  className="shrink-0 opacity-60"
                />
                <span className="label-s-regular text-dark-space truncate">
                  {f.name}
                </span>
                <span className="label-s-regular text-smoke-4 shrink-0">
                  {formatSize(f.size)}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(i);
                }}
                className="shrink-0 ml-2 text-smoke-4 hover:text-dark-space transition-colors label-s-bold"
              >
                x
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
