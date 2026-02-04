import { ChangeEvent, useMemo, useState } from 'react';
import { calculateConfiguration } from './calculator';
import { ConfigInputs, Orientation } from './types';

const LOGO_URL = 'https://www.mmt.com.au/Files/Product%20assets/Images/13M/atdec.png';
const APP_VERSION = 'v2.8';

const initialInputs: ConfigInputs = {
  rows: 3,
  columns: 3,
  displayWidth: 1440,
  displayHeight: 810,
  vesaWidth: 400,
  vesaHeight: 400,
  displayWeightKg: 25,
  orientation: 'landscape'
};

type NumericField = Exclude<keyof ConfigInputs, 'orientation'>;

type Preset = {
  size: string;
  values: Pick<ConfigInputs, 'displayWidth' | 'displayHeight' | 'vesaWidth' | 'vesaHeight' | 'displayWeightKg'>;
};

type ProductRecord = {
  code: string;
  description: string;
  auUrl: string;
  naUrl: string;
};

const PRODUCT_MASTER: Record<string, ProductRecord> = {
  'ADB-B400': {
    code: 'ADB-B400',
    description: 'ADB VESA 400 Brackets',
    auUrl: 'http://atdec.com.au/adb-b400f',
    naUrl: 'http://atdec.com/adb-b400f'
  },
  'ADB-R48': {
    code: 'ADB-R48',
    description: 'ADB 480mm Rail',
    auUrl: 'http://atdec.com.au/adb-r48-b',
    naUrl: 'http://atdec.com/adb-r48-b'
  },
  'ADB-R68': {
    code: 'ADB-R68',
    description: 'ADB 680mm Rail',
    auUrl: 'http://atdec.com.au/adb-r68-b',
    naUrl: 'http://atdec.com/adb-r68-b'
  },
  'ADB-R125': {
    code: 'ADB-R125',
    description: 'ADB 1250mm Rail',
    auUrl: 'http://atdec.com.au/adb-r125-b',
    naUrl: 'http://atdec.com/adb-r125-b'
  },
  'ADB-R175': {
    code: 'ADB-R175',
    description: 'ADB 1750mm Rail',
    auUrl: 'http://atdec.com.au/adb-r175-b',
    naUrl: 'http://atdec.com/adb-r175-b'
  },
  'ADB-RX': {
    code: 'ADB-RX',
    description: 'ADB Rail Extension Kit',
    auUrl: 'http://atdec.com.au/adb-rx',
    naUrl: 'http://atdec.com/adb-rx'
  }
};

const RAIL_SEGMENT_META: Record<number, { color: string; sku: string }> = {
  480: { color: '#2a9d8f', sku: 'ADB-R48' },
  680: { color: '#f4a261', sku: 'ADB-R68' },
  1250: { color: '#e76f51', sku: 'ADB-R125' },
  1750: { color: '#457b9d', sku: 'ADB-R175' }
};

const DISPLAY_PRESETS: Preset[] = [
  { size: '43”', values: { displayWidth: 953, displayHeight: 536, vesaWidth: 400, vesaHeight: 400, displayWeightKg: 15 } },
  { size: '50”', values: { displayWidth: 1107, displayHeight: 622, vesaWidth: 400, vesaHeight: 400, displayWeightKg: 20 } },
  { size: '55”', values: { displayWidth: 1217, displayHeight: 686, vesaWidth: 400, vesaHeight: 400, displayWeightKg: 25 } },
  { size: '65”', values: { displayWidth: 1440, displayHeight: 810, vesaWidth: 400, vesaHeight: 400, displayWeightKg: 35 } },
  { size: '75”', values: { displayWidth: 1661, displayHeight: 935, vesaWidth: 400, vesaHeight: 400, displayWeightKg: 45 } },
  { size: '85”', values: { displayWidth: 1882, displayHeight: 1059, vesaWidth: 400, vesaHeight: 400, displayWeightKg: 50 } },
  { size: '98”', values: { displayWidth: 2169, displayHeight: 1219, vesaWidth: 400, vesaHeight: 400, displayWeightKg: 60 } }
];

function App() {
  const [inputs, setInputs] = useState<ConfigInputs>(initialInputs);
  const [inputText, setInputText] = useState<Record<NumericField, string>>({
    rows: String(initialInputs.rows),
    columns: String(initialInputs.columns),
    displayWidth: String(initialInputs.displayWidth),
    displayHeight: String(initialInputs.displayHeight),
    vesaWidth: String(initialInputs.vesaWidth),
    vesaHeight: String(initialInputs.vesaHeight),
    displayWeightKg: String(initialInputs.displayWeightKg)
  });

  const calculationInputs = useMemo<ConfigInputs>(() => ({
    rows: Number.parseInt(inputText.rows, 10),
    columns: Number.parseInt(inputText.columns, 10),
    displayWidth: Number.parseInt(inputText.displayWidth, 10),
    displayHeight: Number.parseInt(inputText.displayHeight, 10),
    vesaWidth: Number.parseInt(inputText.vesaWidth, 10),
    vesaHeight: Number.parseInt(inputText.vesaHeight, 10),
    displayWeightKg: Number.parseInt(inputText.displayWeightKg, 10),
    orientation: inputs.orientation
  }), [inputText, inputs.orientation]);

  const { result, error } = useMemo(() => calculateConfiguration(calculationInputs), [calculationInputs]);

  const updateNumericField = (field: NumericField) => (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    if (/^\d*$/.test(nextValue)) {
      setInputText((previous) => ({
        ...previous,
        [field]: nextValue
      }));
    }
  };

  const applyPreset = (presetValues: Preset['values']) => {
    setInputText((previous) => ({
      ...previous,
      displayWidth: String(presetValues.displayWidth),
      displayHeight: String(presetValues.displayHeight),
      vesaWidth: String(presetValues.vesaWidth),
      vesaHeight: String(presetValues.vesaHeight),
      displayWeightKg: String(presetValues.displayWeightKg)
    }));
  };

  const setOrientation = (orientation: Orientation) => {
    setInputs((previous) => ({ ...previous, orientation }));
  };

  const bomRows = useMemo(() => {
    if (!result) {
      return [];
    }

    const rows: Array<{ product: ProductRecord; qty: number }> = [
      { product: PRODUCT_MASTER['ADB-B400'], qty: result.totalBracketPairs }
    ];

    result.totalRails.forEach((rail) => {
      const product = PRODUCT_MASTER[rail.sku];
      if (product) {
        rows.push({ product, qty: rail.qty });
      }
    });

    rows.push({ product: PRODUCT_MASTER['ADB-RX'], qty: result.totalJoiners });
    return rows;
  }, [result]);

  const effectiveWidth = result?.effectiveDisplayWidth ?? 1;
  const effectiveHeight = result?.effectiveDisplayHeight ?? 1;
  const safeColumns = Number.isFinite(calculationInputs.columns) ? Math.max(calculationInputs.columns, 1) : 1;
  const safeRows = Number.isFinite(calculationInputs.rows) ? Math.max(calculationInputs.rows, 1) : 1;

  const svgWidth = 980;
  const svgHeight = 660;
  const marginX = 30;
  const marginTop = 80;
  const marginBottom = 28;

  const wallWidthRaw = effectiveWidth * safeColumns;
  const wallHeightRaw = effectiveHeight * safeRows;
  const usableWidth = svgWidth - marginX * 2;
  const usableHeight = svgHeight - marginTop - marginBottom;
  const scale = Math.min(usableWidth / wallWidthRaw, usableHeight / wallHeightRaw);

  const wallWidthPx = wallWidthRaw * scale;
  const startX = (svgWidth - wallWidthPx) / 2;
  const startY = marginTop;
  const displayWidthPx = effectiveWidth * scale;
  const displayHeightPx = effectiveHeight * scale;
  const safeVesaWidth = Number.isFinite(calculationInputs.vesaWidth) ? Math.max(calculationInputs.vesaWidth, 1) : 1;
  const safeVesaHeight = Number.isFinite(calculationInputs.vesaHeight) ? Math.max(calculationInputs.vesaHeight, 1) : 1;
  const safeWeight = Number.isFinite(calculationInputs.displayWeightKg) ? Math.max(calculationInputs.displayWeightKg, 0) : 0;
  const vesaWidthPx = safeVesaWidth * scale;
  const vesaHeightPx = safeVesaHeight * scale;
  const railHeightPx = 120 * scale;
  const bracketWidthPx = Math.max(40 * scale, 2);
  const bracketHeightPx = Math.max(426 * scale, 8);

  return (
    <div className="page-wrap">
      <header className="app-header">
        <div className="header-top">
          <a href="https://www.atdec.com" target="_blank" rel="noopener noreferrer">
            <img src={LOGO_URL} alt="Atdec logo" className="atdec-logo" />
          </a>
          <span className="header-tools">Product Selection Tools</span>
        </div>
        <h1>[BETA {APP_VERSION}] ADB Modular Digital Signage Mount Configurator</h1>
      </header>

      <div className="app-shell">
        <aside className="panel input-panel">
          <p className="subtle warning-message">
            <span>This is an experimental tool.</span>
            <span>Always check the output for mistakes.</span>
            <span>Users must assume responsibility for errors.</span>
          </p>

          <section className="preset-section">
            <h2>1. Enter Display Specifications</h2>
            <h3>Choose an average display size preset:</h3>
            {error && <p className="input-error">{error}</p>}
            <div className="preset-grid">
              {DISPLAY_PRESETS.map((preset) => (
                <button key={preset.size} type="button" className="preset-btn" onClick={() => applyPreset(preset.values)}>
                  <span>{preset.size}</span>
                  <span>{preset.values.displayWidth} x {preset.values.displayHeight} mm</span>
                  <span>VESA {preset.values.vesaWidth} x {preset.values.vesaHeight} mm</span>
                  <span>{preset.values.displayWeightKg} kg</span>
                </button>
              ))}
            </div>

            <h3>Alternatively, enter manually:</h3>
            <div className="manual-grid">
              <label>
                Display width (mm)
                <input type="number" min={1} step={1} value={inputText.displayWidth} onChange={updateNumericField('displayWidth')} />
              </label>
              <label>
                Display height (mm)
                <input type="number" min={1} step={1} value={inputText.displayHeight} onChange={updateNumericField('displayHeight')} />
              </label>
              <label>
                VESA width (mm)
                <input type="number" min={1} step={1} value={inputText.vesaWidth} onChange={updateNumericField('vesaWidth')} />
              </label>
              <label>
                VESA height (mm)
                <input type="number" min={1} step={1} value={inputText.vesaHeight} onChange={updateNumericField('vesaHeight')} />
              </label>
              <label className="full-width">
                Display weight (kg)
                <input type="number" min={0} step={1} value={inputText.displayWeightKg} onChange={updateNumericField('displayWeightKg')} />
              </label>
            </div>
          </section>

          <section className="array-section">
            <h2>2. Array Specifications</h2>
            <div className="orientation-buttons">
              <button
                type="button"
                className={`orientation-btn ${inputs.orientation === 'landscape' ? 'selected' : ''}`}
                onClick={() => setOrientation('landscape')}
              >
                <span className="orientation-icon landscape" />
                <span>Landscape</span>
              </button>
              <button
                type="button"
                className={`orientation-btn ${inputs.orientation === 'portrait' ? 'selected' : ''}`}
                onClick={() => setOrientation('portrait')}
              >
                <span className="orientation-icon portrait" />
                <span>Portrait</span>
              </button>
            </div>

            <div className="array-grid">
              <label>
                Rows
                <input type="number" min={1} step={1} value={inputText.rows} onChange={updateNumericField('rows')} />
              </label>
              <label>
                Columns
                <input type="number" min={1} step={1} value={inputText.columns} onChange={updateNumericField('columns')} />
              </label>
            </div>
          </section>
        </aside>

        <main className="panel output-panel">
          {error ? (
            <section className="error-block">
              <h2>No Valid Solution</h2>
              <p>{error}</p>
            </section>
          ) : (
            result && (
              <>
                <section>
                  <h2>Summary</h2>
                  <div className="summary-grid">
                    <div>
                      <span>
                        Minimum rail length
                        <br />
                        (each row)
                      </span>
                      <strong>{result.minRail} mm</strong>
                    </div>
                    <div>
                      <span>
                        Maximum rail length
                        <br />
                        (each row)
                      </span>
                      <strong>{result.maxRail} mm</strong>
                    </div>
                    <div>
                      <span>
                        Segment count
                        <br />
                        (each row)
                      </span>
                      <strong>{result.railSegmentsPerRow}</strong>
                    </div>
                    <div>
                      <span>
                        Selected segments
                        <br />
                        combined length (each row)
                      </span>
                      <strong>{result.selectedRailLength} mm</strong>
                    </div>
                  </div>
                </section>

                <section>
                  <h2>Bill Of Materials</h2>
                  <table className="bom-table">
                    <colgroup>
                      <col className="bom-col-narrow" />
                      <col />
                      <col className="bom-col-narrow" />
                      <col className="bom-col-narrow" />
                      <col className="bom-col-narrow" />
                    </colgroup>
                    <thead>
                      <tr>
                        <th>Product Code</th>
                        <th>Product Description</th>
                        <th>Quantity</th>
                        <th>Australia</th>
                        <th>North America</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bomRows.map(({ product, qty }) => {
                        const hasAu = Boolean(product.auUrl);
                        const hasNa = Boolean(product.naUrl);

                        return (
                          <tr key={product.code}>
                            <td>{product.code}</td>
                            <td>{product.description}</td>
                            <td>{qty}</td>
                            <td>
                              {hasAu ? (
                                <a href={product.auUrl} target="_blank" rel="noopener noreferrer" className="buy-link-wrap">
                                  <button type="button" className="buy-link" aria-label={`Buy ${product.code} in Australia`}>
                                    Buy
                                  </button>
                                </a>
                              ) : (
                                <button type="button" disabled title="Link not available">
                                  Buy
                                </button>
                              )}
                            </td>
                            <td>
                              {hasNa ? (
                                <a href={product.naUrl} target="_blank" rel="noopener noreferrer" className="buy-link-wrap">
                                  <button type="button" className="buy-link" aria-label={`Buy ${product.code} in North America`}>
                                    Buy
                                  </button>
                                </a>
                              ) : (
                                <button type="button" disabled title="Link not available">
                                  Buy
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </section>

                <section>
                  <h2>Diagram</h2>
                  <div className="legend">
                    <h3>Legend</h3>
                    <ul>
                      {Object.entries(RAIL_SEGMENT_META)
                        .sort((a, b) => Number(b[0]) - Number(a[0]))
                        .map(([length, meta]) => (
                          <li key={length}>
                            <span className="legend-chip" style={{ backgroundColor: meta.color }} />
                            <span>{meta.sku} - {PRODUCT_MASTER[meta.sku].description}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                  <svg className="schematic" viewBox={`0 0 ${svgWidth} ${svgHeight}`} role="img" aria-label="Digital signage mount schematic">
                    <rect x="0" y="0" width={svgWidth} height={svgHeight} fill="#fbfcff" />

                    {Array.from({ length: safeRows }).map((_, rowIndex) =>
                      Array.from({ length: safeColumns }).map((__, columnIndex) => {
                        const x = startX + columnIndex * displayWidthPx;
                        const y = startY + rowIndex * displayHeightPx;
                        const vesaX = x + (displayWidthPx - vesaWidthPx) / 2;
                        const vesaY = y + (displayHeightPx - vesaHeightPx) / 2;

                        return (
                          <g key={`display-${rowIndex}-${columnIndex}`}>
                            <rect x={x} y={y} width={displayWidthPx} height={displayHeightPx} className="display-rect" />

                            <text x={x + 8} y={y + 16} className="display-label">{result.effectiveDisplayWidth} x {result.effectiveDisplayHeight} mm</text>
                            <text x={x + 8} y={y + 31} className="display-label">VESA: {safeVesaWidth} x {safeVesaHeight}</text>
                            <text x={x + 8} y={y + 46} className="display-label">Weight: {safeWeight} kg</text>

                            <rect x={vesaX} y={vesaY} width={vesaWidthPx} height={vesaHeightPx} className="vesa-rect" />
                            <circle cx={vesaX} cy={vesaY} r="2.2" className="vesa-hole" />
                            <circle cx={vesaX + vesaWidthPx} cy={vesaY} r="2.2" className="vesa-hole" />
                            <circle cx={vesaX} cy={vesaY + vesaHeightPx} r="2.2" className="vesa-hole" />
                            <circle cx={vesaX + vesaWidthPx} cy={vesaY + vesaHeightPx} r="2.2" className="vesa-hole" />

                            <rect
                              x={vesaX - bracketWidthPx / 2}
                              y={vesaY + (vesaHeightPx - bracketHeightPx) / 2}
                              width={bracketWidthPx}
                              height={bracketHeightPx}
                              className="bracket-rect"
                            />
                            <rect
                              x={vesaX + vesaWidthPx - bracketWidthPx / 2}
                              y={vesaY + (vesaHeightPx - bracketHeightPx) / 2}
                              width={bracketWidthPx}
                              height={bracketHeightPx}
                              className="bracket-rect"
                            />
                          </g>
                        );
                      })
                    )}

                    {Array.from({ length: safeRows }).map((_, rowIndex) => {
                      const rowCenterY = startY + rowIndex * displayHeightPx + displayHeightPx / 2;
                      const railLengthPx = result.selectedRailLength * scale;
                      const railStartX = startX + (wallWidthPx - railLengthPx) / 2;
                      let cursor = railStartX;
                      const visualRailSegments = [...result.selectedRailSegments].sort((a, b) => b - a);

                      return (
                        <g key={`rail-row-${rowIndex}`}>
                          {visualRailSegments.map((segment, segmentIndex) => {
                            const segmentPx = segment * scale;
                            const segmentStart = cursor;
                            cursor += segmentPx;
                            const meta = RAIL_SEGMENT_META[segment];

                            return (
                              <g key={`rail-${rowIndex}-${segment}-${segmentIndex}`}>
                                <rect
                                  x={segmentStart}
                                  y={rowCenterY - railHeightPx / 2}
                                  width={segmentPx}
                                  height={railHeightPx}
                                  fill={meta?.color ?? '#8da0b3'}
                                  stroke="#27445f"
                                  strokeWidth="1"
                                />
                                <text x={segmentStart + segmentPx / 2} y={rowCenterY + 4} textAnchor="middle" className="rail-label">
                                  {segment} mm
                                </text>
                              </g>
                            );
                          })}
                        </g>
                      );
                    })}
                  </svg>
                </section>
              </>
            )
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
