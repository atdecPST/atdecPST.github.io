import { CalculationResult, ConfigInputs, RailPart } from './types';

const RAIL_SPECS = [
  { length: 1750, sku: 'ADB-R175' },
  { length: 1250, sku: 'ADB-R125' },
  { length: 680, sku: 'ADB-R68' },
  { length: 480, sku: 'ADB-R48' }
] as const;

interface ComboState {
  counts: number[];
  segmentCount: number;
}

function isValidPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 1;
}

function isValidNonNegativeNumber(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function findBestRailCombination(minRail: number, maxRail: number): ComboState | null {
  const dp: Array<ComboState | null> = new Array(maxRail + 1).fill(null);
  dp[0] = { counts: new Array(RAIL_SPECS.length).fill(0), segmentCount: 0 };

  for (let sum = 1; sum <= maxRail; sum += 1) {
    let bestAtSum: ComboState | null = null;

    for (let i = 0; i < RAIL_SPECS.length; i += 1) {
      const rail = RAIL_SPECS[i];
      if (sum < rail.length) {
        continue;
      }

      const previous = dp[sum - rail.length];
      if (!previous) {
        continue;
      }

      const candidate: ComboState = {
        counts: [...previous.counts],
        segmentCount: previous.segmentCount + 1
      };
      candidate.counts[i] += 1;

      if (!bestAtSum || candidate.segmentCount < bestAtSum.segmentCount) {
        bestAtSum = candidate;
      }
    }

    dp[sum] = bestAtSum;
  }

  let bestTarget: number | null = null;
  let bestCombination: ComboState | null = null;

  for (let target = minRail; target <= maxRail; target += 1) {
    const candidate = dp[target];
    if (!candidate) {
      continue;
    }

    if (!bestCombination || candidate.segmentCount < bestCombination.segmentCount) {
      bestCombination = candidate;
      bestTarget = target;
      continue;
    }

    if (candidate.segmentCount === bestCombination.segmentCount && bestTarget !== null && target < bestTarget) {
      bestCombination = candidate;
      bestTarget = target;
    }
  }

  return bestCombination;
}

function sortedSegmentsFromCounts(counts: number[]): number[] {
  const segments: number[] = [];

  for (let i = 0; i < counts.length; i += 1) {
    for (let j = 0; j < counts[i]; j += 1) {
      segments.push(RAIL_SPECS[i].length);
    }
  }

  return segments;
}

export function calculateConfiguration(inputs: ConfigInputs): { result: CalculationResult | null; error: string | null } {
  const {
    rows,
    columns,
    displayWidth,
    displayHeight,
    vesaWidth,
    vesaHeight,
    displayWeightKg,
    orientation
  } = inputs;

  if (!isValidPositiveInteger(rows) || !isValidPositiveInteger(columns)) {
    return { result: null, error: 'Rows and columns must be integers greater than or equal to 1.' };
  }

  const mustBePositive = [displayWidth, displayHeight, vesaWidth, vesaHeight];
  if (mustBePositive.some((value) => !isValidPositiveInteger(value))) {
    return { result: null, error: 'All dimensions must be integer millimetres greater than or equal to 1.' };
  }

  if (!isValidNonNegativeNumber(displayWeightKg)) {
    return { result: null, error: 'Display weight must be a non-negative number.' };
  }

  if (displayWeightKg > 50) {
    return {
      result: null,
      error: 'This tool does not support ADB-B600H configurations yet. Please contact Atdec for more information.'
    };
  }

  if (vesaHeight > 400) {
    return {
      result: null,
      error: 'This does not support display brackets longer than ADB-B400 yet. Please contact Atdec for more information'
    };
  }

  const effectiveDisplayWidth = orientation === 'portrait' ? displayHeight : displayWidth;
  const effectiveDisplayHeight = orientation === 'portrait' ? displayWidth : displayHeight;

  const minRail = effectiveDisplayWidth * (columns - 1) + vesaWidth + 80;
  const maxRail = effectiveDisplayWidth * columns;

  if (minRail > maxRail) {
    return {
      result: null,
      error: `Invalid configuration: minimum rail length (${minRail} mm) exceeds maximum rail length (${maxRail} mm).`
    };
  }

  const bestCombination = findBestRailCombination(minRail, maxRail);
  if (!bestCombination) {
    return {
      result: null,
      error: `No valid rail combination exists between ${minRail} mm and ${maxRail} mm using available rail sizes.`
    };
  }

  const railPartsPerRow: RailPart[] = RAIL_SPECS.reduce<RailPart[]>((accumulator, rail, i) => {
    const qty = bestCombination.counts[i];
    if (qty > 0) {
      accumulator.push({
        length: rail.length,
        sku: rail.sku,
        qty
      });
    }
    return accumulator;
  }, []);

  const totalRails: RailPart[] = railPartsPerRow.map((part) => ({
    ...part,
    qty: part.qty * rows
  }));

  const selectedRailSegments = sortedSegmentsFromCounts(bestCombination.counts);
  const selectedRailLength = selectedRailSegments.reduce((sum, segment) => sum + segment, 0);
  const railSegmentsPerRow = bestCombination.segmentCount;

  const result: CalculationResult = {
    effectiveDisplayWidth,
    effectiveDisplayHeight,
    minRail,
    maxRail,
    selectedRailLength,
    selectedRailSegments,
    railPartsPerRow,
    railSegmentsPerRow,
    totalBracketPairs: rows * columns,
    totalRails,
    totalJoiners: Math.max(railSegmentsPerRow - 1, 0) * rows
  };

  return { result, error: null };
}

export const FIXED_SKUS = {
  bracketPair: 'ADB-B400',
  railJoiner: 'ADB-RX'
} as const;
