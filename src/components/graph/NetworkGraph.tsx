'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import cytoscape, { type Core, type Layouts } from 'cytoscape';
import type { CytoscapeNode, CytoscapeEdge } from '@/lib/types';
import styles from './NetworkGraph.module.scss';

interface NetworkGraphProps {
  nodes: CytoscapeNode[];
  edges: CytoscapeEdge[];
}

export function NetworkGraph({ nodes, edges }: NetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const layoutRef = useRef<Layouts | null>(null);
  const destroyedRef = useRef(false);
  const router = useRouter();

  const handleNodeTap = useCallback(
    (evt: cytoscape.EventObject) => {
      const node = evt.target;
      const nodeType = node.data('type') as string;
      const nodeId = node.data('id') as string;

      if (nodeType === 'person') {
        router.push(`/people/${nodeId}`);
      } else if (nodeType === 'organization') {
        router.push(`/organizations/${nodeId}`);
      } else if (nodeType === 'event') {
        router.push(`/events/${nodeId}`);
      }
    },
    [router]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    destroyedRef.current = false;

    const cy = cytoscape({
      container: containerRef.current,
      elements: { nodes, edges },
      style: [
        {
          selector: 'node',
          style: {
            label: 'data(label)',
            color: '#e0e0e6',
            'text-valign': 'bottom',
            'text-halign': 'center',
            'font-size': '11px',
            'font-family': 'Inter, sans-serif',
            'text-margin-y': 6,
            width: 28,
            height: 28,
            'border-width': 2,
            'border-color': '#2a2a3a',
          },
        },
        {
          selector: 'node[type="person"]',
          style: {
            'background-color': '#4a90d9',
            shape: 'ellipse',
          },
        },
        {
          selector: 'node[type="organization"]',
          style: {
            'background-color': '#d9a84a',
            shape: 'round-rectangle',
          },
        },
        {
          selector: 'node[type="event"]',
          style: {
            'background-color': '#9b59b6',
            shape: 'diamond',
            width: 24,
            height: 24,
            'font-size': '10px',
          },
        },
        {
          selector: 'node[riskLevel="HIGH"]',
          style: {
            'background-color': '#d94a4a',
            'border-color': '#ff6060',
          },
        },
        {
          selector: 'node[riskLevel="CRITICAL"]',
          style: {
            'background-color': '#991a1a',
            'border-color': '#d94a4a',
            'border-width': 3,
          },
        },
        {
          selector: 'edge',
          style: {
            width: 1.5,
            'line-color': '#3a3a4a',
            'target-arrow-color': '#3a3a4a',
            'target-arrow-shape': 'triangle',
            'arrow-scale': 0.8,
            'curve-style': 'bezier',
            label: 'data(label)',
            'font-size': '9px',
            'font-family': 'Inter, sans-serif',
            color: '#8888a0',
            'text-rotation': 'autorotate',
            'text-margin-y': -8,
          },
        },
        {
          selector: 'node:selected',
          style: {
            'border-color': '#4a90d9',
            'border-width': 3,
            'background-opacity': 1,
          },
        },
        {
          selector: 'edge:selected',
          style: {
            'line-color': '#4a90d9',
            'target-arrow-color': '#4a90d9',
            width: 2.5,
          },
        },
        // Hover highlight
        {
          selector: 'node:active',
          style: {
            'overlay-opacity': 0.15,
            'overlay-color': '#4a90d9',
          },
        },
      ],
      layout: { name: 'preset' },
      minZoom: 0.2,
      maxZoom: 5,
    });

    cyRef.current = cy;

    // Click node to navigate to entity detail
    cy.on('tap', 'node', handleNodeTap);

    // Hover cursor
    cy.on('mouseover', 'node', () => {
      if (containerRef.current) {
        containerRef.current.style.cursor = 'pointer';
      }
    });
    cy.on('mouseout', 'node', () => {
      if (containerRef.current) {
        containerRef.current.style.cursor = 'default';
      }
    });

    // Run layout separately so we hold a stoppable reference
    const layout = cy.layout({
      name: 'cose',
      idealEdgeLength: () => 120,
      nodeOverlap: 20,
      refresh: 20,
      fit: true,
      padding: 40,
      randomize: false,
      componentSpacing: 120,
      nodeRepulsion: () => 500000,
      edgeElasticity: () => 100,
      nestingFactor: 5,
      gravity: 80,
      numIter: 1000,
      initialTemp: 200,
      coolingFactor: 0.95,
      minTemp: 1.0,
    });

    layoutRef.current = layout;
    layout.run();

    return () => {
      destroyedRef.current = true;

      // Stop the layout first — prevents further rAF ticks
      if (layoutRef.current) {
        layoutRef.current.stop();
        layoutRef.current = null;
      }

      // Delay destruction by one frame so any already-queued rAF
      // callback from the layout can complete against a still-alive
      // instance. This eliminates the "notify" race condition entirely.
      const cyInstance = cyRef.current;
      cyRef.current = null;

      if (cyInstance && !cyInstance.destroyed()) {
        requestAnimationFrame(() => {
          if (!cyInstance.destroyed()) {
            cyInstance.destroy();
          }
        });
      }
    };
  }, [nodes, edges, handleNodeTap]);

  return <div ref={containerRef} className={styles.graph} />;
}
