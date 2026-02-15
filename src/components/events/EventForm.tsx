'use client';

import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../ui/EntityForm.module.scss';

interface EventData {
  id?: string;
  title?: string;
  type?: string | null;
  description?: string | null;
  date?: string | Date | null;
  endDate?: string | Date | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  country?: string | null;
  estimatedStatus?: string | null;
  notes?: string | null;
  tags?: string[] | null;
}

interface EventFormProps {
  initialData?: EventData;
  mode: 'create' | 'edit';
}

function toDateTimeLocal(v: string | Date | null | undefined): string {
  if (!v) return '';
  const d = typeof v === 'string' ? new Date(v) : v;
  return d.toISOString().slice(0, 16);
}

export function EventForm({ initialData, mode }: EventFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState('');

  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim();
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
      }
      setTagInput('');
    }
    if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  }

  function removeTag(idx: number) {
    setTags(tags.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const form = new FormData(e.currentTarget);
    const str = (key: string) => {
      const v = (form.get(key) as string)?.trim();
      return v || undefined;
    };

    const body: Record<string, unknown> = {};
    const val = (key: string) => {
      const v = str(key);
      return mode === 'edit' ? (v || null) : v;
    };

    body.title = str('title') || '';
    body.type = val('type');
    body.description = val('description');
    body.location = val('location');
    body.country = val('country');
    body.estimatedStatus = val('estimatedStatus');
    body.notes = val('notes');
    body.tags = tags.length > 0 ? tags : [];

    const date = str('date');
    if (date) body.date = new Date(date).toISOString();
    const endDate = str('endDate');
    if (endDate) body.endDate = new Date(endDate).toISOString();

    const lat = str('latitude');
    const lng = str('longitude');
    if (lat) body.latitude = parseFloat(lat);
    if (lng) body.longitude = parseFloat(lng);

    if (!body.title) {
      setError('Event title is required');
      setSaving(false);
      return;
    }

    try {
      const url = mode === 'edit' ? `/api/events/${initialData?.id}` : '/api/events';
      const method = mode === 'edit' ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Failed to save');
        setSaving(false);
        return;
      }

      router.push(`/events/${json.data.id}`);
      router.refresh();
    } catch {
      setError('Network error');
      setSaving(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Event Info</h3>
        <div className={styles.fieldGrid}>
          <div className={styles.wrapper}>
            <label className={styles.label}>Title *</label>
            <input name="title" className={styles.input} required defaultValue={initialData?.title || ''} />
          </div>
          <div className={styles.wrapper}>
            <label className={styles.label}>Type</label>
            <select name="type" className={styles.select} defaultValue={initialData?.type || ''}>
              <option value="">Select type...</option>
              <option value="meeting">Meeting</option>
              <option value="transaction">Transaction</option>
              <option value="communication">Communication</option>
              <option value="incident">Incident</option>
              <option value="travel">Travel</option>
              <option value="surveillance">Surveillance</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className={styles.wrapper}>
            <label className={styles.label}>Date</label>
            <input name="date" type="datetime-local" className={styles.input} defaultValue={toDateTimeLocal(initialData?.date)} />
          </div>
          <div className={styles.wrapper}>
            <label className={styles.label}>End Date</label>
            <input name="endDate" type="datetime-local" className={styles.input} defaultValue={toDateTimeLocal(initialData?.endDate)} />
          </div>
          <div className={styles.wrapper}>
            <label className={styles.label}>Status</label>
            <select name="estimatedStatus" className={styles.select} defaultValue={initialData?.estimatedStatus || ''}>
              <option value="">Select status...</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="SUSPECTED">Suspected</option>
              <option value="UNVERIFIED">Unverified</option>
              <option value="DENIED">Denied</option>
            </select>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Location</h3>
        <div className={styles.fieldGrid}>
          <div className={styles.wrapper}>
            <label className={styles.label}>Location</label>
            <input name="location" className={styles.input} defaultValue={initialData?.location || ''} />
          </div>
          <div className={styles.wrapper}>
            <label className={styles.label}>Country</label>
            <input name="country" className={styles.input} defaultValue={initialData?.country || ''} />
          </div>
          <div className={styles.wrapper}>
            <label className={styles.label}>Latitude</label>
            <input name="latitude" type="number" step="any" className={styles.input} defaultValue={initialData?.latitude ?? ''} />
          </div>
          <div className={styles.wrapper}>
            <label className={styles.label}>Longitude</label>
            <input name="longitude" type="number" step="any" className={styles.input} defaultValue={initialData?.longitude ?? ''} />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Details</h3>
        <div className={styles.fieldGrid}>
          <div className={`${styles.wrapper} ${styles.fieldFull}`}>
            <label className={styles.label}>Description</label>
            <textarea name="description" className={styles.textarea} rows={3} defaultValue={initialData?.description || ''} />
          </div>
          <div className={`${styles.wrapper} ${styles.fieldFull}`}>
            <label className={styles.label}>Tags (press Enter to add)</label>
            <div className={styles.tagsInput}>
              {tags.map((t, i) => (
                <span key={t} className={styles.tag}>
                  {t}
                  <button type="button" className={styles.tagRemove} onClick={() => removeTag(i)}>x</button>
                </span>
              ))}
              <input
                className={styles.tagInput}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder={tags.length === 0 ? 'Add tags...' : ''}
              />
            </div>
          </div>
          <div className={`${styles.wrapper} ${styles.fieldFull}`}>
            <label className={styles.label}>Notes</label>
            <textarea name="notes" className={styles.textarea} rows={3} defaultValue={initialData?.notes || ''} />
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <button type="submit" className={styles.submitBtn} disabled={saving}>
          {saving ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Create Event'}
        </button>
        <Link href={mode === 'edit' && initialData?.id ? `/events/${initialData.id}` : '/events'} className={styles.cancelBtn}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
