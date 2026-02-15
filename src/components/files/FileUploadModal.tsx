'use client';

import { useState, useRef, type FormEvent, type DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '../ui/Modal';
import { formatFileSize } from '@/lib/utils';
import styles from './FileUploadModal.module.scss';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'person' | 'organization' | 'event';
  entityId: string;
}

const entityParamMap = {
  person: 'personId',
  organization: 'organizationId',
  event: 'eventId',
} as const;

export function FileUploadModal({ isOpen, onClose, entityType, entityId }: FileUploadModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  function handleReset() {
    setSelectedFile(null);
    setError('');
    setUploading(false);
    setDragOver(false);
  }

  function handleClose() {
    handleReset();
    onClose();
  }

  function handleFileSelect(file: File) {
    setError('');
    setSelectedFile(file);
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
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append(entityParamMap[entityType], entityId);

    const desc = new FormData(e.currentTarget).get('description') as string;
    if (desc?.trim()) {
      formData.append('description', desc.trim());
    }

    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Upload failed');
        setUploading(false);
        return;
      }

      handleClose();
      router.refresh();
    } catch {
      setError('Network error');
      setUploading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Upload File">
      <form className={styles.form} onSubmit={handleSubmit}>
        {error && <div className={styles.error}>{error}</div>}

        <div
          className={`${styles.dropZone} ${dragOver ? styles.dropZoneActive : ''} ${selectedFile ? styles.dropZoneHasFile : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className={styles.fileInput}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />
          {selectedFile ? (
            <div className={styles.selectedFile}>
              <span className={styles.fileName}>{selectedFile.name}</span>
              <span className={styles.fileMeta}>
                {selectedFile.type || 'unknown type'} &middot; {formatFileSize(selectedFile.size)}
              </span>
            </div>
          ) : (
            <div className={styles.dropPrompt}>
              <span className={styles.dropIcon}>+</span>
              <span>Drop file here or click to browse</span>
            </div>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Description</label>
          <textarea
            name="description"
            className={styles.textarea}
            rows={2}
            placeholder="Optional file description..."
          />
        </div>

        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={!selectedFile || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
          <button type="button" className={styles.cancelBtn} onClick={handleClose}>
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
