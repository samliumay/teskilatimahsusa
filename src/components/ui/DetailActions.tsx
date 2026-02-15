'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Modal } from './Modal';
import { LinkEntityModal } from '../relationships/LinkEntityModal';
import styles from './DetailActions.module.scss';

interface DetailActionsProps {
  entityType: 'people' | 'organizations' | 'events';
  entityId: string;
  entityName: string;
}

const sourceTypeMap = {
  people: 'person',
  organizations: 'organization',
  events: 'event',
} as const;

export function DetailActions({ entityType, entityId, entityName }: DetailActionsProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [archiving, setArchiving] = useState(false);

  async function handleArchive() {
    setArchiving(true);
    try {
      const res = await fetch(`/api/${entityType}/${entityId}`, { method: 'DELETE' });
      if (res.ok) {
        router.push(`/${entityType}`);
        router.refresh();
      }
    } catch {
      setArchiving(false);
    }
  }

  return (
    <>
      <div className={styles.actions}>
        <button className={styles.linkBtn} onClick={() => setShowLink(true)}>+ Link</button>
        <Link href={`/${entityType}/${entityId}/edit`} className={styles.editBtn}>Edit</Link>
        <button className={styles.deleteBtn} onClick={() => setShowConfirm(true)}>Archive</button>
      </div>

      <LinkEntityModal
        isOpen={showLink}
        onClose={() => setShowLink(false)}
        sourceType={sourceTypeMap[entityType]}
        sourceId={entityId}
        sourceName={entityName}
      />

      <Modal isOpen={showConfirm} onClose={() => setShowConfirm(false)} title="Confirm Archive">
        <div className={styles.confirmBody}>
          <p>Are you sure you want to archive <strong>{entityName}</strong>?</p>
          <p className={styles.confirmHint}>This record will be soft-deleted and hidden from default views. It can be restored later.</p>
          <div className={styles.confirmActions}>
            <button
              className={styles.confirmBtn}
              onClick={handleArchive}
              disabled={archiving}
            >
              {archiving ? 'Archiving...' : 'Archive'}
            </button>
            <button
              className={styles.cancelBtn}
              onClick={() => setShowConfirm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
