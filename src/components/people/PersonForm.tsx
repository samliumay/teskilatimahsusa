'use client';

import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileAttachments, type PendingFile } from '../files/FileAttachments';
import styles from '../ui/EntityForm.module.scss';

interface PersonData {
  id?: string;
  firstName?: string | null;
  lastName?: string | null;
  aliases?: string[] | null;
  dateOfBirth?: string | Date | null;
  placeOfBirth?: string | null;
  nationality?: string | null;
  gender?: string | null;
  email?: string[] | null;
  phone?: string[] | null;
  address?: string | null;
  passportNo?: string | null;
  nationalId?: string | null;
  taxId?: string | null;
  driversLicense?: string | null;
  notes?: string | null;
  tags?: string[] | null;
  riskLevel?: string | null;
}

interface PersonFormProps {
  initialData?: PersonData;
  mode: 'create' | 'edit';
}

export function PersonForm({ initialData, mode }: PersonFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);

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
    const body: Record<string, unknown> = {};

    const str = (key: string) => {
      const v = (form.get(key) as string)?.trim();
      return v || undefined;
    };

    // For PATCH, send null to clear fields. For POST, omit empty fields.
    const val = (key: string) => {
      const v = str(key);
      return mode === 'edit' ? (v || null) : v;
    };

    body.firstName = val('firstName');
    body.lastName = val('lastName');
    body.placeOfBirth = val('placeOfBirth');
    body.nationality = val('nationality');
    body.gender = val('gender');
    body.address = val('address');
    body.passportNo = val('passportNo');
    body.nationalId = val('nationalId');
    body.taxId = val('taxId');
    body.driversLicense = val('driversLicense');
    body.notes = val('notes');
    body.riskLevel = val('riskLevel');
    body.tags = tags.length > 0 ? tags : [];

    const dob = str('dateOfBirth');
    if (dob) {
      body.dateOfBirth = new Date(dob).toISOString();
    }

    const aliases = str('aliases');
    body.aliases = aliases ? aliases.split(',').map((a) => a.trim()).filter(Boolean) : [];

    const emails = str('email');
    body.email = emails ? emails.split(',').map((a) => a.trim()).filter(Boolean) : [];

    const phones = str('phone');
    body.phone = phones ? phones.split(',').map((a) => a.trim()).filter(Boolean) : [];

    try {
      const url = mode === 'edit' ? `/api/people/${initialData?.id}` : '/api/people';
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

      const entityId = json.data.id;

      // Upload any attached files
      for (const pf of pendingFiles) {
        const fileData = new FormData();
        fileData.append('file', pf.file);
        fileData.append('personId', entityId);
        if (pf.description.trim()) {
          fileData.append('description', pf.description.trim());
        }
        await fetch('/api/files', { method: 'POST', body: fileData });
      }

      router.push(`/people/${entityId}`);
      router.refresh();
    } catch {
      setError('Network error');
      setSaving(false);
    }
  }

  const dob = initialData?.dateOfBirth
    ? (typeof initialData.dateOfBirth === 'string'
        ? initialData.dateOfBirth.slice(0, 10)
        : new Date(initialData.dateOfBirth).toISOString().slice(0, 10))
    : '';

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Identity</h3>
        <div className={styles.fieldGrid}>
          <div className={styles.wrapper}>
            <label className={styles.label}>First Name</label>
            <input name="firstName" className={styles.input} defaultValue={initialData?.firstName || ''} />
          </div>
          <div className={styles.wrapper}>
            <label className={styles.label}>Last Name</label>
            <input name="lastName" className={styles.input} defaultValue={initialData?.lastName || ''} />
          </div>
          <div className={styles.wrapper}>
            <label className={styles.label}>Aliases (comma-separated)</label>
            <input name="aliases" className={styles.input} defaultValue={initialData?.aliases?.join(', ') || ''} />
          </div>
          <div className={styles.wrapper}>
            <label className={styles.label}>Date of Birth</label>
            <input name="dateOfBirth" type="date" className={styles.input} defaultValue={dob} />
          </div>
          <div className={styles.wrapper}>
            <label className={styles.label}>Place of Birth</label>
            <input name="placeOfBirth" className={styles.input} defaultValue={initialData?.placeOfBirth || ''} />
          </div>
          <div className={styles.wrapper}>
            <label className={styles.label}>Nationality</label>
            <input name="nationality" className={styles.input} defaultValue={initialData?.nationality || ''} />
          </div>
          <div className={styles.wrapper}>
            <label className={styles.label}>Gender</label>
            <input name="gender" className={styles.input} defaultValue={initialData?.gender || ''} />
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
        <h3 className={styles.sectionTitle}>Contact & Identifiers</h3>
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
          <div className={styles.wrapper}>
            <label className={styles.label}>Passport No.</label>
            <input name="passportNo" className={styles.input} defaultValue={initialData?.passportNo || ''} />
          </div>
          <div className={styles.wrapper}>
            <label className={styles.label}>National ID</label>
            <input name="nationalId" className={styles.input} defaultValue={initialData?.nationalId || ''} />
          </div>
          <div className={styles.wrapper}>
            <label className={styles.label}>Tax ID</label>
            <input name="taxId" className={styles.input} defaultValue={initialData?.taxId || ''} />
          </div>
          <div className={styles.wrapper}>
            <label className={styles.label}>Driver&apos;s License</label>
            <input name="driversLicense" className={styles.input} defaultValue={initialData?.driversLicense || ''} />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Tags & Notes</h3>
        <div className={styles.fieldGrid}>
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
            <textarea name="notes" className={styles.textarea} rows={4} defaultValue={initialData?.notes || ''} />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Attachments</h3>
        <FileAttachments files={pendingFiles} onChange={setPendingFiles} />
      </div>

      <div className={styles.actions}>
        <button type="submit" className={styles.submitBtn} disabled={saving}>
          {saving ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Create Person'}
        </button>
        <Link href={mode === 'edit' && initialData?.id ? `/people/${initialData.id}` : '/people'} className={styles.cancelBtn}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
