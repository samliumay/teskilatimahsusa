'use client';

import { useEffect, useState } from 'react';
import { NetworkGraph } from '@/components/graph/NetworkGraph';
import type { GraphData } from '@/lib/types';
import styles from './page.module.scss';

export default function GraphPage() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/graph')
      .then((res) => res.json())
      .then((result) => {
        setGraphData(result.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load graph:', err);
        setError('Failed to load network graph');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className={styles.state}>
        <p className={styles.stateText}>Loading network graph...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.state}>
        <p className={styles.stateError}>{error}</p>
      </div>
    );
  }

  if (!graphData || (graphData.nodes.length === 0 && graphData.edges.length === 0)) {
    return (
      <div className={styles.state}>
        <p className={styles.stateText}>No data to visualize yet.</p>
        <p className={styles.stateHint}>Add people, organizations, and relationships to see the network graph.</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Network Graph</h1>
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={`${styles.dot} ${styles.dotPerson}`} /> Person
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.dot} ${styles.dotOrg}`} /> Organization
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.dot} ${styles.dotEvent}`} /> Event
          </span>
          <span className={styles.legendHint}>Click a node to view details</span>
        </div>
      </div>
      <div className={styles.graphWrapper}>
        <NetworkGraph nodes={graphData.nodes} edges={graphData.edges} />
      </div>
    </div>
  );
}
