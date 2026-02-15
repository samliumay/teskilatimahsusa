'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '../ui/Modal';
import styles from './LinkEntityModal.module.scss';

type RelationType =
  | 'person-to-person'
  | 'person-to-org'
  | 'org-to-org'
  | 'event-to-person'
  | 'event-to-org';

interface EntityOption {
  id: string;
  label: string;
}

interface LinkEntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceType: 'person' | 'organization' | 'event';
  sourceId: string;
  sourceName: string;
}

export function LinkEntityModal({
  isOpen,
  onClose,
  sourceType,
  sourceId,
  sourceName,
}: LinkEntityModalProps) {
  const router = useRouter();
  const [targetType, setTargetType] = useState<'person' | 'organization' | 'event'>('person');
  const [targets, setTargets] = useState<EntityOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Determine which target types are available
  const availableTargets = getAvailableTargets(sourceType);

  useEffect(() => {
    if (!isOpen) return;
    const targets = getAvailableTargets(sourceType);
    setTargetType(targets[0]?.value || 'person');
  }, [isOpen, sourceType]);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch(`/api/${targetType === 'person' ? 'people' : targetType + 's'}?limit=100`)
      .then((r) => r.json())
      .then((json) => {
        const items = json.data || [];
        setTargets(
          items
            .filter((item: { id: string }) => item.id !== sourceId)
            .map((item: Record<string, unknown>) => ({
              id: item.id as string,
              label: getEntityLabel(targetType, item),
            }))
        );
      })
      .catch(() => setTargets([]))
      .finally(() => setLoading(false));
  }, [isOpen, targetType, sourceId]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const form = new FormData(e.currentTarget);
    const targetId = form.get('targetId') as string;
    if (!targetId) {
      setError('Please select a target entity');
      setSaving(false);
      return;
    }

    const relType = getRelationType(sourceType, targetType);
    const body = buildRelationshipBody(relType, sourceId, targetId, form, sourceType);

    try {
      const res = await fetch('/api/relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Failed to create relationship');
        setSaving(false);
        return;
      }

      onClose();
      router.refresh();
    } catch {
      setError('Network error');
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Link ${sourceName}`}>
      <form className={styles.form} onSubmit={handleSubmit}>
        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.field}>
          <label className={styles.label}>Link to</label>
          <select
            className={styles.select}
            value={targetType}
            onChange={(e) => setTargetType(e.target.value as 'person' | 'organization' | 'event')}
          >
            {availableTargets.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Select {targetType}</label>
          {loading ? (
            <div className={styles.hint}>Loading...</div>
          ) : (
            <select name="targetId" className={styles.select} required>
              <option value="">Choose...</option>
              {targets.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          )}
        </div>

        {renderContextFields(sourceType, targetType)}

        <div className={styles.field}>
          <label className={styles.label}>Notes</label>
          <textarea name="notes" className={styles.textarea} rows={2} />
        </div>

        <div className={styles.actions}>
          <button type="submit" className={styles.submitBtn} disabled={saving}>
            {saving ? 'Linking...' : 'Create Link'}
          </button>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

type TargetType = 'person' | 'organization' | 'event';

function getAvailableTargets(sourceType: string): { value: TargetType; label: string }[] {
  switch (sourceType) {
    case 'person':
      return [
        { value: 'person', label: 'Person' },
        { value: 'organization', label: 'Organization' },
      ];
    case 'organization':
      return [
        { value: 'person', label: 'Person' },
        { value: 'organization', label: 'Organization' },
      ];
    case 'event':
      return [
        { value: 'person', label: 'Person' },
        { value: 'organization', label: 'Organization' },
      ];
    default:
      return [];
  }
}

function getEntityLabel(type: string, item: Record<string, unknown>): string {
  switch (type) {
    case 'person': {
      const first = item.firstName as string | null;
      const last = item.lastName as string | null;
      return [first, last].filter(Boolean).join(' ') || 'Unknown';
    }
    case 'organization':
      return (item.name as string) || 'Unknown';
    case 'event':
      return (item.title as string) || 'Unknown';
    default:
      return 'Unknown';
  }
}

function getRelationType(source: string, target: string): RelationType {
  if (source === 'person' && target === 'person') return 'person-to-person';
  if (source === 'person' && target === 'organization') return 'person-to-org';
  if (source === 'organization' && target === 'person') return 'person-to-org';
  if (source === 'organization' && target === 'organization') return 'org-to-org';
  if (source === 'event' && target === 'person') return 'event-to-person';
  if (source === 'event' && target === 'organization') return 'event-to-org';
  return 'person-to-person';
}

function buildRelationshipBody(
  relType: RelationType,
  sourceId: string,
  targetId: string,
  form: FormData,
  sourceType: string,
): Record<string, unknown> {
  const str = (key: string) => {
    const v = (form.get(key) as string)?.trim();
    return v || undefined;
  };

  const base = { type: relType, notes: str('notes') };

  switch (relType) {
    case 'person-to-person':
      return {
        ...base,
        sourcePersonId: sourceId,
        targetPersonId: targetId,
        relationshipType: str('relationshipType'),
        strength: str('strength'),
        estimatedStatus: str('estimatedStatus'),
      };
    case 'person-to-org':
      return {
        ...base,
        personId: sourceType === 'person' ? sourceId : targetId,
        organizationId: sourceType === 'organization' ? sourceId : targetId,
        role: str('role'),
        department: str('department'),
      };
    case 'org-to-org':
      return {
        ...base,
        sourceOrgId: sourceId,
        targetOrgId: targetId,
        relationshipType: str('relationshipType'),
      };
    case 'event-to-person':
      return {
        ...base,
        eventId: sourceId,
        personId: targetId,
        role: str('role'),
      };
    case 'event-to-org':
      return {
        ...base,
        eventId: sourceId,
        organizationId: targetId,
        role: str('role'),
      };
    default:
      return base;
  }
}

function renderContextFields(sourceType: string, targetType: string) {
  if (sourceType === 'person' && targetType === 'person') {
    return (
      <>
        <div className={styles.field}>
          <label className={styles.label}>Relationship Type</label>
          <input name="relationshipType" className={styles.input} placeholder="friend, colleague, handler..." />
        </div>
        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label className={styles.label}>Strength</label>
            <select name="strength" className={styles.select}>
              <option value="">Unknown</option>
              <option value="STRONG">Strong</option>
              <option value="MODERATE">Moderate</option>
              <option value="WEAK">Weak</option>
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Status</label>
            <select name="estimatedStatus" className={styles.select}>
              <option value="">Select...</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="SUSPECTED">Suspected</option>
              <option value="UNVERIFIED">Unverified</option>
            </select>
          </div>
        </div>
      </>
    );
  }

  if (
    (sourceType === 'person' && targetType === 'organization') ||
    (sourceType === 'organization' && targetType === 'person')
  ) {
    return (
      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <label className={styles.label}>Role</label>
          <input name="role" className={styles.input} placeholder="CEO, analyst, member..." />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Department</label>
          <input name="department" className={styles.input} placeholder="Operations, Finance..." />
        </div>
      </div>
    );
  }

  if (sourceType === 'organization' && targetType === 'organization') {
    return (
      <div className={styles.field}>
        <label className={styles.label}>Relationship Type</label>
        <input name="relationshipType" className={styles.input} placeholder="parent, subsidiary, partner..." />
      </div>
    );
  }

  if (sourceType === 'event') {
    return (
      <div className={styles.field}>
        <label className={styles.label}>Role</label>
        <input name="role" className={styles.input} placeholder="attendee, organizer, target..." />
      </div>
    );
  }

  return null;
}
