'use client';

import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../ui/EntityForm.module.scss';

interface OrgData {
  id?: string;
  name?: string;
  type?: string | null;
  industry?: string | null;
  country?: string | null;
  address?: string | null;
  website?: string | null;
  phone?: string[] | null;
  email?: string[] | null;
  foundedAt?: string | Date | null;
  description?: string | null;
  notes?: string | null;
  tags?: string[] | null;
  riskLevel?: string | null;
}

interface OrgFormProps {
  initialData?: OrgData;
  mode: 'create' | 'edit';
}

export function OrgForm({ initialData, mode }: OrgFormProps) {
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

    body.name = str('name') || '';
    body.type = val('type');
    body.industry = val('industry');
    body.country = val('country');
    body.address = val('address');
    body.website = val('website');
    body.description = val('description');
    body.notes = val('notes');
    body.riskLevel = val('riskLevel');
    body.tags = tags.length > 0 ? tags : [];

    const founded = str('foundedAt');
    if (founded) {
      body.foundedAt = new Date(founded).toISOString();
    }

    const emails = str('email');
    body.email = emails ? emails.split(',').map((a) => a.trim()).filter(Boolean) : [];

    const phones = str('phone');
    body.phone = phones ? phones.split(',').map((a) => a.trim()).filter(Boolean) : [];

    if (!body.name) {
      setError('Organization name is required');
      setSaving(false);
      return;
    }

    try {
      const url = mode === 'edit' ? `/api/organizations/${initialData?.id}` : '/api/organizations';
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

      router.push(`/organizations/${json.data.id}`);
      router.refresh();
    } catch {
      setError('Network error');
      setSaving(false);
    }
  }

  const founded = initialData?.foundedAt
    ? (typeof initialData.foundedAt === 'string'
        ? initialData.foundedAt.slice(0, 10)
        : new Date(initialData.foundedAt).toISOString().slice(0, 10))
    : '';

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Organization Info</h3>
        <div className={styles.fieldGrid}>
          <div className={styles.wrapper}>
            <label className={styles.label}>Name *</label>
            <input name="name" className={styles.input} required defaultValue={initialData?.name || ''} />
          </div>
          <div className={styles.wrapper}>
            <label className={styles.label}>Type</label>
            <select name="type" className={styles.select} defaultValue={initialData?.type || ''}>
              <option value="">Select type...</option>
              <option value="company">Company</option>
              <option value="government">Government</option>
              <option value="ngo">NGO</option>
              <option value="military">Military</option>
              <option value="criminal">Criminal</option>
              <option value="political">Political</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className={styles.wrapper}>
            <label className={styles.label}>Industry</label>
            <input name="industry" className={styles.input} defaultValue={initialData?.industry || ''} />
          </div>
          <div className={styles.wrapper}>
            <label className={styles.label}>Country</label>
            <input name="country" className={styles.input} defaultValue={initialData?.country || ''} />
          </div>
          <div className={styles.wrapper}>
            <label className={styles.label}>Website</label>
            <input name="website" className={styles.input} defaultValue={initialData?.website || ''} />
          </div>
          <div className={styles.wrapper}>
            <label className={styles.label}>Founded</label>
            <input name="foundedAt" type="date" className={styles.input} defaultValue={founded} />
          </div>
          <div className={styles.wrapper}>
            <label className={styles.label}>Risk Level</label>
            <select name="riskLevel" className={styles.select} defaultValue={initialData?.riskLevel || ''}>
              <option value="">None</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Contact</h3>
        <div className={styles.fieldGrid}>
          <div className={styles.wrapper}>
            <label className={styles.label}>Email (comma-separated)</label>
            <input name="email" className={styles.input} defaultValue={initialData?.email?.join(', ') || ''} />
          </div>
          <div className={styles.wrapper}>
            <label className={styles.label}>Phone (comma-separated)</label>
            <input name="phone" className={styles.input} defaultValue={initialData?.phone?.join(', ') || ''} />
          </div>
          <div className={`${styles.wrapper} ${styles.fieldFull}`}>
            <label className={styles.label}>Address</label>
            <input name="address" className={styles.input} defaultValue={initialData?.address || ''} />
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
          {saving ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Create Organization'}
        </button>
        <Link href={mode === 'edit' && initialData?.id ? `/organizations/${initialData.id}` : '/organizations'} className={styles.cancelBtn}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
