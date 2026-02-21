'use client';

import { useState, useRef, type DragEvent } from 'react';
import styles from './page.module.scss';

interface ImportResult {
  people: number;
  organizations: number;
  events: number;
  relationships: number;
  breakdown: {
    personToPerson: number;
    personToOrg: number;
    orgToOrg: number;
    eventToPerson: number;
    eventToOrg: number;
    eventToEvent: number;
  };
}

type Status = 'idle' | 'fileSelected' | 'importing' | 'success' | 'error';

export default function SimulationPage() {
  const [status, setStatus] = useState<Status>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [wiping, setWiping] = useState(false);
  const [wipeResult, setWipeResult] = useState<string | null>(null);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    if (!file.name.endsWith('.json')) {
      setError('Only .json files are accepted');
      setStatus('error');
      return;
    }
    setSelectedFile(file);
    setStatus('fileSelected');
    setError('');
    setErrorDetails('');
    setResult(null);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    setDragActive(true);
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    setDragActive(false);
  }

  function handleClear() {
    setSelectedFile(null);
    setStatus('idle');
    setError('');
    setErrorDetails('');
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleImport() {
    if (!selectedFile) return;
    setStatus('importing');
    setError('');
    setErrorDetails('');

    try {
      const text = await selectedFile.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        setError('Invalid JSON — could not parse the file');
        setStatus('error');
        return;
      }

      const res = await fetch('/api/simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Import failed');
        if (json.details) {
          setErrorDetails(
            Array.isArray(json.details)
              ? json.details.map((d: string | { message?: string }) =>
                  typeof d === 'string' ? d : d.message || JSON.stringify(d)
                ).join('\n')
              : JSON.stringify(json.details, null, 2),
          );
        }
        setStatus('error');
        return;
      }

      setResult(json.data);
      setStatus('success');
    } catch {
      setError('Network error — could not reach the server');
      setStatus('error');
    }
  }

  function formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const size = bytes / Math.pow(1024, i);
    return `${i === 0 ? size : size.toFixed(1)} ${units[i]}`;
  }

  async function handleWipeout() {
    setWiping(true);
    setWipeResult(null);
    try {
      const res = await fetch('/api/simulation', { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) {
        setWipeResult(`Error: ${json.error || 'Wipeout failed'}`);
      } else {
        const msg = json.data.filesRemoved > 0
          ? `All data wiped. ${json.data.filesRemoved} file(s) removed from storage.`
          : 'All data wiped. No files in storage.';
        setWipeResult(msg);
      }
    } catch {
      setWipeResult('Error: Network error — could not reach the server');
    } finally {
      setWiping(false);
      setConfirmWipe(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Simulation</h1>
        <p className={styles.description}>
          Bulk import people, organizations, events, and relationships from a JSON file.
        </p>
      </div>

      {/* ─── Documentation ──────────────────────────────── */}
      <div className={styles.docsCard}>
        <h2 className={styles.docsTitle}>JSON Format</h2>
        <p className={styles.docsText}>
          The JSON file should contain four top-level arrays: <strong>people</strong>, <strong>organizations</strong>,
          {' '}<strong>events</strong>, and <strong>relationships</strong>. All arrays are optional — include only what you need.
          Each entity requires a unique <code>_ref</code> key (a temporary string identifier) so that relationships can reference
          entities before they have database UUIDs.
        </p>

        <div className={styles.docsGrid}>
          <div className={styles.docsBlock}>
            <h3 className={styles.docsBlockTitle}>Entity Types</h3>
            <ul className={styles.docsBlockList}>
              <li>people — firstName, lastName, nationality, riskLevel, tags, ...</li>
              <li>organizations — name*, type, industry, country, ...</li>
              <li>events — title*, type, date, location, estimatedStatus, ...</li>
            </ul>
          </div>
          <div className={styles.docsBlock}>
            <h3 className={styles.docsBlockTitle}>Relationship Types</h3>
            <ul className={styles.docsBlockList}>
              <li>person-to-person — source, target, relationshipType, strength</li>
              <li>person-to-org — person, organization, role</li>
              <li>org-to-org — source, target, relationshipType</li>
              <li>event-to-person — event, person, role</li>
              <li>event-to-org — event, organization, role</li>
              <li>event-to-event — source, target, relationshipType</li>
            </ul>
          </div>
        </div>

        <div className={styles.codeBlock}>
          <pre>{`{
  "people": [
    { "_ref": "person-ali", "firstName": "Ali", "lastName": "Yilmaz", "riskLevel": "HIGH" }
  ],
  "organizations": [
    { "_ref": "org-acme", "name": "ACME Trading Corp", "type": "company" }
  ],
  "events": [
    { "_ref": "evt-meeting", "title": "Istanbul Meeting", "type": "meeting" }
  ],
  "relationships": [
    { "type": "person-to-org", "person": "person-ali", "organization": "org-acme", "role": "CEO" },
    { "type": "event-to-person", "event": "evt-meeting", "person": "person-ali", "role": "organizer" }
  ]
}`}</pre>
        </div>

        <a href="/sample-simulation.json" download className={styles.downloadBtn}>
          Download Sample JSON
        </a>
      </div>

      {/* ─── Upload ─────────────────────────────────────── */}
      <div className={styles.uploadCard}>
        <h2 className={styles.uploadTitle}>Import Data</h2>

        {status === 'idle' || status === 'error' ? (
          <div
            className={`${styles.dropZone} ${dragActive ? styles.dropZoneActive : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className={styles.dropIcon}>[ JSON ]</div>
            <div className={styles.dropText}>
              Drop a .json file here or click to browse
            </div>
            <div className={styles.dropHint}>
              All entities and relationships will be imported in a single transaction
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </div>
        ) : null}

        {(status === 'fileSelected' || status === 'importing') && selectedFile && (
          <>
            <div className={styles.fileInfo}>
              <span className={styles.fileName}>{selectedFile.name}</span>
              <span className={styles.fileSize}>{formatSize(selectedFile.size)}</span>
            </div>
            <div className={styles.uploadActions}>
              <button
                className={styles.importBtn}
                onClick={handleImport}
                disabled={status === 'importing'}
              >
                {status === 'importing' ? 'Importing...' : 'Import'}
              </button>
              <button
                className={styles.clearBtn}
                onClick={handleClear}
                disabled={status === 'importing'}
              >
                Clear
              </button>
            </div>
          </>
        )}

        {status === 'success' && (
          <div className={styles.uploadActions}>
            <button className={styles.clearBtn} onClick={handleClear}>
              Import Another
            </button>
          </div>
        )}
      </div>

      {/* ─── Results ────────────────────────────────────── */}
      {status === 'success' && result && (
        <div className={styles.resultCard}>
          <h2 className={`${styles.resultTitle} ${styles.resultSuccess}`}>
            Import Successful
          </h2>

          <div className={styles.countsGrid}>
            <div className={styles.countItem}>
              <span className={styles.countValue}>{result.people}</span>
              <span className={styles.countLabel}>People</span>
            </div>
            <div className={styles.countItem}>
              <span className={styles.countValue}>{result.organizations}</span>
              <span className={styles.countLabel}>Organizations</span>
            </div>
            <div className={styles.countItem}>
              <span className={styles.countValue}>{result.events}</span>
              <span className={styles.countLabel}>Events</span>
            </div>
            <div className={styles.countItem}>
              <span className={styles.countValue}>{result.relationships}</span>
              <span className={styles.countLabel}>Relationships</span>
            </div>
          </div>

          <h3 className={styles.breakdownTitle}>Relationship Breakdown</h3>
          <div className={styles.breakdownGrid}>
            <div className={styles.breakdownItem}>
              <span className={styles.breakdownLabel}>Person → Person</span>
              <span className={styles.breakdownCount}>{result.breakdown.personToPerson}</span>
            </div>
            <div className={styles.breakdownItem}>
              <span className={styles.breakdownLabel}>Person → Org</span>
              <span className={styles.breakdownCount}>{result.breakdown.personToOrg}</span>
            </div>
            <div className={styles.breakdownItem}>
              <span className={styles.breakdownLabel}>Org → Org</span>
              <span className={styles.breakdownCount}>{result.breakdown.orgToOrg}</span>
            </div>
            <div className={styles.breakdownItem}>
              <span className={styles.breakdownLabel}>Event → Person</span>
              <span className={styles.breakdownCount}>{result.breakdown.eventToPerson}</span>
            </div>
            <div className={styles.breakdownItem}>
              <span className={styles.breakdownLabel}>Event → Org</span>
              <span className={styles.breakdownCount}>{result.breakdown.eventToOrg}</span>
            </div>
            <div className={styles.breakdownItem}>
              <span className={styles.breakdownLabel}>Event → Event</span>
              <span className={styles.breakdownCount}>{result.breakdown.eventToEvent}</span>
            </div>
          </div>
        </div>
      )}

      {status === 'error' && error && (
        <div className={styles.resultCard}>
          <h2 className={`${styles.resultTitle} ${styles.resultError}`}>
            Import Failed
          </h2>
          <p className={styles.docsText}>{error}</p>
          {errorDetails && (
            <div className={styles.errorDetails}>
              <pre>{errorDetails}</pre>
            </div>
          )}
        </div>
      )}

      {/* ─── Wipeout ────────────────────────────────────── */}
      <div className={styles.wipeCard}>
        <div className={styles.wipeHeader}>
          <div>
            <h2 className={styles.wipeTitle}>Wipeout</h2>
            <p className={styles.wipeText}>
              Permanently delete all data from the database and file storage. This action cannot be undone.
            </p>
          </div>
          {!confirmWipe ? (
            <button
              className={styles.wipeBtn}
              onClick={() => setConfirmWipe(true)}
              disabled={wiping}
            >
              Wipe All Data
            </button>
          ) : (
            <div className={styles.wipeConfirm}>
              <span className={styles.wipeWarning}>Are you sure?</span>
              <button
                className={styles.wipeConfirmBtn}
                onClick={handleWipeout}
                disabled={wiping}
              >
                {wiping ? 'Wiping...' : 'Yes, wipe everything'}
              </button>
              <button
                className={styles.clearBtn}
                onClick={() => setConfirmWipe(false)}
                disabled={wiping}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
        {wipeResult && (
          <div className={`${styles.wipeResult} ${wipeResult.startsWith('Error') ? styles.resultError : styles.resultSuccess}`}>
            {wipeResult}
          </div>
        )}
      </div>
    </div>
  );
}
