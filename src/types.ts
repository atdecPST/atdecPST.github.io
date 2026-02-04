export type Orientation = 'landscape' | 'portrait';

export interface ConfigInputs {
  rows: number;
  columns: number;
  displayWidth: number;
  displayHeight: number;
  vesaWidth: number;
  vesaHeight: number;
  displayWeightKg: number;
  orientation: Orientation;
}

export interface RailPart {
  length: number;
  sku: string;
  qty: number;
}

export interface CalculationResult {
  effectiveDisplayWidth: number;
  effectiveDisplayHeight: number;
  minRail: number;
  maxRail: number;
  selectedRailLength: number;
  selectedRailSegments: number[];
  railPartsPerRow: RailPart[];
  railSegmentsPerRow: number;
  totalBracketPairs: number;
  totalRails: RailPart[];
  totalJoiners: number;
}
