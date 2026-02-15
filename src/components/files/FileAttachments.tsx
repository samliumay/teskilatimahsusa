'use client';

import { useState, useRef, type DragEvent } from 'react';
import { formatFileSize } from '@/lib/utils';
import styles from './FileAttachments.module.scss';

interface PendingFile {
  file: File;
  description: string;
}

interface FileAttachmentsProps {
  files: PendingFile[];
  onChange: (files: PendingFile[]) => void;
}

export type { PendingFile };

export function FileAttachments({ files, onChange }: FileAttachmentsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function addFiles(newFiles: FileList | File[]) {
    const added: PendingFile[] = Array.from(newFiles).map((f) => ({
      file: f,
      description: '',
    }));
    onChange([...files, ...added]);
  }

  function removeFile(idx: number) {
    onChange(files.filter((_, i) => i !== idx));
  }

  function updateDescription(idx: number, desc: string) {
    const updated = files.map((f, i) => (i === idx ? { ...f, description: desc } : f));
    onChange(updated);
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }

  return (
    <div className={styles.container}>
      <div
        className={`${styles.dropZone} ${dragOver ? styles.dropZoneActive : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className={styles.fileInput}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              addFiles(e.target.files);
              e.target.value = '';
            }
          }}
        />
        <span className={styles.dropIcon}>+</span>
        <span className={styles.dropText}>Drop files here or click to browse</span>
      </div>

      {files.length > 0 && (
        <div className={styles.fileList}>
          {files.map((pf, idx) => (
            <div key={`${pf.file.name}-${idx}`} className={styles.fileItem}>
              <div className={styles.fileInfo}>
                <span className={styles.fileName}>{pf.file.name}</span>
                <span className={styles.fileMeta}>
                  {pf.file.type || 'unknown'} &middot; {formatFileSize(pf.file.size)}
                </span>
              </div>
              <input
                className={styles.descInput}
                placeholder="Description (optional)"
                value={pf.description}
                onChange={(e) => updateDescription(idx, e.target.value)}
              />
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => removeFile(idx)}
                title="Remove"
              >
                &#x2715;
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
