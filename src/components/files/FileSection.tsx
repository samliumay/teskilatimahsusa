'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDate, formatFileSize } from '@/lib/utils';
import { FileUploadModal } from './FileUploadModal';
import styles from './FileSection.module.scss';

interface FileSectionProps {
  entityType: 'person' | 'organization' | 'event';
  entityId: string;
}

interface FileRecord {
  id: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  fileSize: number | null;
  description: string | null;
  createdAt: string;
}

const entityParamMap = {
  person: 'personId',
  organization: 'organizationId',
  event: 'eventId',
} as const;

function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'IMG';
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'XLS';
  if (mimeType.includes('document') || mimeType.includes('word')) return 'DOC';
  if (mimeType.includes('zip') || mimeType.includes('archive') || mimeType.includes('compressed')) return 'ZIP';
  if (mimeType.startsWith('text/')) return 'TXT';
  if (mimeType.startsWith('video/')) return 'VID';
  if (mimeType.startsWith('audio/')) return 'AUD';
  return 'FILE';
}

export function FileSection({ entityType, entityId }: FileSectionProps) {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    try {
      const param = entityParamMap[entityType];
      const res = await fetch(`/api/files?${param}=${entityId}`);
      const json = await res.json();
      if (res.ok && json.data) {
        setFiles(json.data);
      }
    } catch {
      // Silently fail — files are supplementary
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  async function handleDelete(fileId: string) {
    setDeletingId(fileId);
    try {
      const res = await fetch(`/api/files/${fileId}`, { method: 'DELETE' });
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
      }
    } catch {
      // Silently fail
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDownload(fileId: string, fileName: string) {
    try {
      const res = await fetch(`/api/files/${fileId}`);
      const json = await res.json();
      if (res.ok && json.data?.downloadUrl) {
        const link = document.createElement('a');
        link.href = json.data.downloadUrl;
        link.download = fileName;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.click();
      }
    } catch {
      // Silently fail
    }
  }

  function handleUploadClose() {
    setShowUpload(false);
    fetchFiles();
  }

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          Files ({loading ? '...' : files.length})
        </h2>
        <button className={styles.uploadBtn} onClick={() => setShowUpload(true)}>
          + Upload
        </button>
      </div>

      <div className={styles.card}>
        {loading ? (
          <div className={styles.emptyState}>Loading files...</div>
        ) : files.length === 0 ? (
          <div className={styles.emptyState}>No files attached</div>
        ) : (
          <div className={styles.fileList}>
            {files.map((f) => (
              <div key={f.id} className={styles.fileItem}>
                <span className={styles.fileIcon}>{getFileIcon(f.fileType)}</span>
                <div className={styles.fileInfo}>
                  <span className={styles.fileName}>{f.fileName}</span>
                  <span className={styles.fileMeta}>
                    {formatFileSize(f.fileSize)} &middot; {formatDate(f.createdAt)}
                    {f.description && <> &middot; {f.description}</>}
                  </span>
                </div>
                <div className={styles.fileActions}>
                  <button
                    className={styles.downloadBtn}
                    onClick={() => handleDownload(f.id, f.fileName)}
                    title="Download"
                  >
                    &#8595;
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(f.id)}
                    disabled={deletingId === f.id}
                    title="Delete"
                  >
                    &#x2715;
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <FileUploadModal
        isOpen={showUpload}
        onClose={handleUploadClose}
        entityType={entityType}
        entityId={entityId}
      />
    </section>
  );
}
