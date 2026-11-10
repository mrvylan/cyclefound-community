"use client";

import { useRef } from "react";
import { GripVertical, ImagePlus, X } from "lucide-react";
import { blobToDataUrl, compressImageFile } from "@/lib/profile/image";

type Props = {
  photos: string[];
  onChange: (photos: string[]) => void;
  max?: number;
  reorder?: boolean;
};

async function filesToDataUrls(files: FileList | File[]): Promise<string[]> {
  const list = Array.from(files);
  const urls: string[] = [];
  for (const file of list) {
    try {
      const blob = await compressImageFile(file, { maxEdge: 1600, quality: 0.82 });
      urls.push(await blobToDataUrl(blob));
    } catch {
      // Fall back to the raw file so a single bad compress doesn't block the rest.
      const raw = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      urls.push(raw);
    }
  }
  return urls;
}

export function PhotoPicker({ photos, onChange, max = 4, reorder = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragIndex = useRef<number | null>(null);

  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    const room = max - photos.length;
    if (room <= 0) return;
    const next = await filesToDataUrls(Array.from(files).slice(0, room));
    onChange([...photos, ...next]);
  }

  function removeAt(index: number) {
    onChange(photos.filter((_, i) => i !== index));
  }

  function onDragStart(index: number) {
    dragIndex.current = index;
  }

  function onDrop(index: number) {
    if (dragIndex.current == null || dragIndex.current === index) return;
    const next = [...photos];
    const [moved] = next.splice(dragIndex.current, 1);
    next.splice(index, 0, moved);
    dragIndex.current = null;
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {photos.map((src, i) => (
          <div
            key={`${src.slice(0, 32)}-${i}`}
            className="relative size-20 overflow-hidden rounded-[10px] border border-line bg-ground sm:size-24"
            draggable={reorder}
            onDragStart={() => onDragStart(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(i)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="size-full object-cover" />
            {reorder ? (
              <span className="absolute left-1 top-1 rounded bg-white/90 p-0.5 text-muted">
                <GripVertical className="size-3.5" aria-hidden />
              </span>
            ) : null}
            <button
              type="button"
              aria-label="Remove photo"
              onClick={() => removeAt(i)}
              className="absolute right-1 top-1 inline-flex size-7 items-center justify-center rounded-full bg-ink text-white"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </div>
        ))}
        {photos.length < max ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex size-20 flex-col items-center justify-center gap-1 rounded-[10px] border border-dashed border-[#D4D3CD] bg-white text-[12px] font-medium text-muted sm:size-24"
          >
            <ImagePlus className="size-5" aria-hidden />
            Add
          </button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => {
          void addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <p className="m-0 text-[12px] text-muted">
        Up to {max} photos
        {reorder ? " · drag to reorder" : ""}.
      </p>
    </div>
  );
}
