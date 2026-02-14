export type Theme = 'dark' | 'gray' | 'white';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type EstimatedStatus = 'CONFIRMED' | 'SUSPECTED' | 'UNVERIFIED' | 'DENIED';

export type RelationStrength = 'STRONG' | 'MODERATE' | 'WEAK' | 'UNKNOWN';

export interface CytoscapeNode {
  data: {
    id: string;
    label: string;
    type: 'person' | 'organization' | 'event';
    riskLevel?: string;
  };
}

export interface CytoscapeEdge {
  data: {
    id: string;
    source: string;
    target: string;
    label?: string;
    relationType: string;
  };
}

export interface GraphData {
  nodes: CytoscapeNode[];
  edges: CytoscapeEdge[];
}
