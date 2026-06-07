import React, { useRef, useState, useCallback, useEffect } from 'react';

// ── Geometry constants ────────────────────────────────────────────────────────
const SVG_SIZE   = 980;
const CX         = SVG_SIZE / 2;
const CY         = SVG_SIZE / 2;

// Outer display ring (week dates + month names) — kept thin to maximise task area
const WEEK_OUTER_R   = 460;  // outer edge of outer ring
const WEEK_SPLIT_R   = 442;  // month-name / week-date boundary  (18 px month band)
const OUTER_R        = 422;  // inner edge of outer ring          (20 px week-date band)

// Task area — starts right inside the outer ring
const TASK_OUTER_START = 418; // outer edge of ring 0 (4 px gap from OUTER_R)
const TASK_BAND        = 74;
const TASK_GAP         = 4;
const CENTER_R         = 95;
const MAX_RINGS        = 4;

// Text radii (midpoints of each sub-ring)
const WEEK_DATE_R  = (OUTER_R + WEEK_SPLIT_R) / 2;    // ≈ 432
const MONTH_NAME_R = (WEEK_SPLIT_R + WEEK_OUTER_R) / 2; // ≈ 451

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun',
                      'Jul','Aug','Sep','Oct','Nov','Dec'];
const DEG_PER_WEEK = 360 / 52;

// ── Helpers ───────────────────────────────────────────────────────────────────
function deg2rad(d) { return d * Math.PI / 180; }

function polar(r, angleDeg) {
  const rad = deg2rad(angleDeg);
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function mStart(m) { return -90 + (m - 1) * 30; }
function mEnd(m)   { return -90 + m * 30; }
function wStart(w) { return -90 + (w - 1) * DEG_PER_WEEK; }
function wEnd(w)   { return -90 + w * DEG_PER_WEEK; }

function taskStartDeg(t) {
  return t.unit === 'week' ? wStart(t.start_week) : mStart(t.start_month);
}
function taskEndDeg(t) {
  return t.unit === 'week' ? wEnd(t.end_week) : mEnd(t.end_month);
}

function f(n) { return n.toFixed(3); }

function annularSector(outerR, innerR, startDeg, endDeg, gapDeg = 1.2) {
  const s    = startDeg + gapDeg;
  const e    = endDeg   - gapDeg;
  const span = e - s;
  const large = span > 180 ? 1 : 0;
  const oS = polar(outerR, s), oE = polar(outerR, e);
  const iS = polar(innerR, s), iE = polar(innerR, e);
  return [
    `M ${f(oS.x)},${f(oS.y)}`,
    `A ${outerR},${outerR} 0 ${large},1 ${f(oE.x)},${f(oE.y)}`,
    `L ${f(iE.x)},${f(iE.y)}`,
    `A ${innerR},${innerR} 0 ${large},0 ${f(iS.x)},${f(iS.y)}`,
    'Z',
  ].join(' ');
}

function ringRadii(ring) {
  const outer = TASK_OUTER_START - ring * TASK_BAND;
  const inner = outer - TASK_BAND + TASK_GAP;
  return { outer, inner };
}

// Word-wrap title into up to 3 lines of maxChars each.
// The last line is truncated with '…' if text still overflows.
function wrapLabel(title, maxChars) {
  if (title.length <= maxChars) return [title];
  const words = title.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (lines.length === 2) {
      current = test; // last line — keep appending, truncate at end
    } else if (test.length <= maxChars) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) {
    lines.push(current.length > maxChars ? current.slice(0, maxChars - 1) + '…' : current);
  }
  return lines;
}

// ISO 8601 week number
function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

// Monday of ISO week w in year y
function weekMonday(w, y) {
  const jan4 = new Date(y, 0, 4);
  const jan4Dow = (jan4.getDay() + 6) % 7;
  return new Date(jan4.getTime() - jan4Dow * 86400000 + (w - 1) * 7 * 86400000);
}

// Build array of "9–15" labels for all 52 weeks
function buildWeekLabels(year) {
  return Array.from({ length: 52 }, (_, i) => {
    const mon = weekMonday(i + 1, year);
    const sun = new Date(mon.getTime() + 6 * 86400000);
    return `${mon.getDate()}–${sun.getDate()}`;
  });
}

// Tangential rotation that keeps text readable (not upside-down)
function readableRot(midAng) {
  const rot = midAng + 90;
  return (midAng > 0 && midAng < 180) ? rot + 180 : rot;
}

// ── Zoom/pan hook (supports mouse wheel, pointer drag, and pinch-to-zoom) ─────
function useZoomPan(svgRef) {
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const pointers  = useRef(new Map()); // pointerId → { x, y }
  const pinchDist = useRef(null);

  const onWheel = useCallback(e => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    setTransform(t => {
      const scale = Math.min(Math.max(t.scale * factor, 0.4), 6);
      const rect  = svgRef.current.getBoundingClientRect();
      const cx    = e.clientX - rect.left;
      const cy    = e.clientY - rect.top;
      return {
        scale,
        x: cx - (cx - t.x) * (scale / t.scale),
        y: cy - (cy - t.y) * (scale / t.scale),
      };
    });
  }, [svgRef]);

  const onPointerDown = useCallback(e => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    // Do NOT call setPointerCapture here — deferring to first actual movement
    // ensures click events still fire on task arcs when there is no drag.
  }, []);

  const onPointerMove = useCallback(e => {
    if (!pointers.current.has(e.pointerId)) return;
    const prev = pointers.current.get(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const pts = [...pointers.current.values()];

    if (pts.length >= 2) {
      // ── Pinch zoom ──
      const [[ax, ay], [bx, by]] = pts.map(p => [p.x, p.y]);
      const dist = Math.hypot(bx - ax, by - ay);

      // Capture both pointers so pinch works when fingers leave the element
      [...pointers.current.keys()].forEach(id => {
        if (svgRef.current && !svgRef.current.hasPointerCapture(id)) {
          svgRef.current.setPointerCapture(id);
        }
      });

      if (pinchDist.current != null && dist > 0) {
        const factor = dist / pinchDist.current;
        const rect = svgRef.current.getBoundingClientRect();
        const cx = (ax + bx) / 2 - rect.left;
        const cy = (ay + by) / 2 - rect.top;
        setTransform(t => {
          const scale = Math.min(Math.max(t.scale * factor, 0.4), 6);
          return {
            scale,
            x: cx - (cx - t.x) * (scale / t.scale),
            y: cy - (cy - t.y) * (scale / t.scale),
          };
        });
      }
      pinchDist.current = dist;
    } else {
      // ── Single-pointer pan ──
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      if (dx !== 0 || dy !== 0) {
        // Capture on first actual movement (leaves click events unaffected when no drag)
        if (svgRef.current && !svgRef.current.hasPointerCapture(e.pointerId)) {
          svgRef.current.setPointerCapture(e.pointerId);
        }
        setTransform(t => ({ ...t, x: t.x + dx, y: t.y + dy }));
      }
    }
  }, [svgRef]);

  const onPointerUp = useCallback(e => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchDist.current = null;
  }, []);

  const resetZoom = useCallback(() => setTransform({ x: 0, y: 0, scale: 1 }), []);

  const zoomBy = useCallback(factor => {
    setTransform(t => {
      const scale = Math.min(Math.max(t.scale * factor, 0.4), 6);
      const el   = svgRef.current;
      const rect = el ? el.getBoundingClientRect() : { width: 0, height: 0 };
      const cx   = rect.width  / 2;
      const cy   = rect.height / 2;
      return {
        scale,
        x: cx - (cx - t.x) * (scale / t.scale),
        y: cy - (cy - t.y) * (scale / t.scale),
      };
    });
  }, [svgRef]);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [svgRef, onWheel]);

  return { transform, onPointerDown, onPointerMove, onPointerUp, resetZoom, zoomBy };
}

// ── Wheel component ───────────────────────────────────────────────────────────
export default function Wheel({ tasks, activeId, onTaskClick, year }) {
  const svgRef   = useRef(null);
  const now      = new Date();
  const thisYear = now.getFullYear();
  const isCurrentYear = year === thisYear;
  const curMonth = isCurrentYear ? now.getMonth() + 1 : -1;
  const curWeek  = isCurrentYear ? isoWeek(now) : -1;
  const weekLabels = buildWeekLabels(year);
  const { transform, onPointerDown, onPointerMove, onPointerUp, resetZoom, zoomBy } = useZoomPan(svgRef);

  return (
    <div className="wheel-container">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        width={SVG_SIZE}
        height={SVG_SIZE}
        id="wheel"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ cursor: 'grab', touchAction: 'none', userSelect: 'none' }}
      >
        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}
           style={{ transformOrigin: `${CX}px ${CY}px` }}>

          {/* ── Outer circle background ── */}
          <circle cx={CX} cy={CY} r={WEEK_OUTER_R} fill="#EEF0F3" stroke="#CDD0D6" strokeWidth="1.5"/>

          {/* ── Sector backgrounds (CENTER_R → OUTER_R) ── */}
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
            const isCurrent = m === curMonth;
            const fill = isCurrent ? '#D6E8FF' : (m % 2 === 0 ? '#E5E8EE' : '#F0F2F5');
            return <path key={m} d={annularSector(OUTER_R, CENTER_R, mStart(m), mEnd(m), 0)} fill={fill} stroke="none"/>;
          })}

          {/* ── Outer ring: week-date sub-ring (OUTER_R → WEEK_SPLIT_R) ── */}
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
            const isCurrent = m === curMonth;
            const fill = isCurrent ? '#BDD8F5' : (m % 2 === 0 ? '#CDD2E0' : '#D5DAE8');
            return <path key={m} d={annularSector(WEEK_SPLIT_R, OUTER_R, mStart(m), mEnd(m), 0)} fill={fill} stroke="none"/>;
          })}

          {/* ── Outer ring: month-name sub-ring (WEEK_SPLIT_R → WEEK_OUTER_R) ── */}
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
            const isCurrent = m === curMonth;
            const fill = isCurrent ? '#A8CBF0' : (m % 2 === 0 ? '#C8CED8' : '#D0D6E6');
            return <path key={m} d={annularSector(WEEK_OUTER_R, WEEK_SPLIT_R, mStart(m), mEnd(m), 0)} fill={fill} stroke="none"/>;
          })}

          {/* ── 52 week dividers in the outer ring ── */}
          {Array.from({ length: 52 }, (_, i) => i + 1).map(w => {
            const ang   = wStart(w);
            const inner = polar(OUTER_R,      ang);
            const outer = polar(WEEK_OUTER_R, ang);
            const isCurWeekBoundary = w === curWeek || w === curWeek + 1;
            return (
              <line key={w}
                x1={f(inner.x)} y1={f(inner.y)}
                x2={f(outer.x)} y2={f(outer.y)}
                stroke={isCurWeekBoundary ? 'rgba(26,74,138,0.4)' : 'rgba(255,255,255,0.7)'}
                strokeWidth={isCurWeekBoundary ? '1' : '0.6'}
              />
            );
          })}

          {/* ── Week date range labels ── */}
          {Array.from({ length: 52 }, (_, i) => i + 1).map(w => {
            const midAng = wStart(w) + DEG_PER_WEEK / 2;
            const pos    = polar(WEEK_DATE_R, midAng);
            const rot    = readableRot(midAng);
            const isCurWeek = w === curWeek;
            return (
              <text key={w}
                transform={`translate(${f(pos.x)},${f(pos.y)}) rotate(${f(rot)})`}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="7"
                fontFamily="system-ui,sans-serif"
                fontWeight={isCurWeek ? '700' : '400'}
                fill={isCurWeek ? '#1A4A8A' : '#5A5F70'}
              >
                {weekLabels[w - 1]}
              </text>
            );
          })}

          {/* ── Month name labels (in outer sub-ring) ── */}
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
            const midAng    = mStart(m) + 15;
            const pos       = polar(MONTH_NAME_R, midAng);
            const rot       = readableRot(midAng);
            const isCurrent = m === curMonth;
            return (
              <text key={m}
                transform={`translate(${f(pos.x)},${f(pos.y)}) rotate(${f(rot)})`}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="10"
                fontFamily="system-ui,sans-serif"
                fontWeight={isCurrent ? '800' : '600'}
                fill={isCurrent ? '#1A4A8A' : '#3A3F52'}
              >
                {MONTHS_SHORT[m - 1]}
              </text>
            );
          })}

          {/* ── Radial month dividers (full height) ── */}
          {Array.from({ length: 12 }, (_, i) => i).map(m => {
            const ang   = -90 + m * 30;
            const inner = polar(CENTER_R,     ang);
            const outer = polar(WEEK_OUTER_R, ang);
            return <line key={m} x1={f(inner.x)} y1={f(inner.y)} x2={f(outer.x)} y2={f(outer.y)} stroke="white" strokeWidth="1.8"/>;
          })}

          {/* ── Quarter markers (bolder) ── */}
          {Array.from({ length: 4 }, (_, i) => i).map(q => {
            const ang   = -90 + q * 90;
            const inner = polar(CENTER_R,     ang);
            const outer = polar(WEEK_OUTER_R, ang);
            return <line key={q} x1={f(inner.x)} y1={f(inner.y)} x2={f(outer.x)} y2={f(outer.y)} stroke="white" strokeWidth="3"/>;
          })}

          {/* ── Quarter labels ── */}
          {['Q1','Q2','Q3','Q4'].map((label, q) => {
            const midAng = -90 + q * 90 + 45;
            const pos    = polar(WEEK_OUTER_R + 18, midAng);
            return (
              <text key={q} x={f(pos.x)} y={f(pos.y)}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="11" fontFamily="system-ui,sans-serif"
                fontWeight="700" fill="#8A8FA0" letterSpacing="0.5">
                {label}
              </text>
            );
          })}

          {/* ── Task arcs ── */}
          {tasks.map(task => {
            const { outer, inner } = ringRadii(task.ring ?? 0);
            if (inner < CENTER_R + 4) return null;

            const color    = task.displayColor;
            const startDeg = taskStartDeg(task);
            const endDeg   = taskEndDeg(task);
            const spanDeg  = endDeg - startDeg;
            // Angular inset trimmed off each end of the visible arc (see annularSector).
            // The label's curved baseline must use the same bounds, otherwise its edge
            // characters are centered into the gap and spill outside the colored shape.
            const gapDeg   = 2;
            const d        = annularSector(outer, inner, startDeg, endDeg, gapDeg);
            const isActive = task.id === activeId;
            const rangeLabel = task.unit === 'week'
              ? `Week ${task.start_week}–${task.end_week}`
              : `${MONTHS_SHORT[task.start_month - 1]}–${MONTHS_SHORT[task.end_month - 1]}`;

            const midAng  = (startDeg + endDeg) / 2;
            const midR    = (outer + inner) / 2;
            // Available label space is the visible (gap-trimmed) arc, not the full task span.
            const trimmedSpanDeg = spanDeg - 2 * gapDeg;
            const arcLength = midR * trimmedSpanDeg * Math.PI / 180;
            const maxChars  = Math.max(4, Math.floor(arcLength / 7));

            const lines = wrapLabel(task.title, maxChars);

            // Bottom-half arcs (midAng 0–180) run counter-clockwise so text reads
            // left-to-right. Offset direction also flips: upper-half text bodies
            // extend toward larger radii; lower-half toward smaller radii.
            const isBottom = midAng > 0 && midAng < 180;
            const large    = spanDeg > 180 ? 1 : 0;
            const LINE_H   = 13;
            const dir      = isBottom ? 1 : -1;

            const makeArcPath = r => {
              const pS = polar(r, startDeg + gapDeg);
              const pE = polar(r, endDeg - gapDeg);
              return isBottom
                ? `M ${f(pE.x)},${f(pE.y)} A ${r},${r} 0 ${large},0 ${f(pS.x)},${f(pS.y)}`
                : `M ${f(pS.x)},${f(pS.y)} A ${r},${r} 0 ${large},1 ${f(pE.x)},${f(pE.y)}`;
            };

            // Very short arcs don't have enough curve length for the label to read
            // well. Rotate it 90° to run radially across the ring's band instead —
            // that band has a constant width and often more room than the curve does.
            const useCurved   = arcLength >= 50;
            const radialSpan  = outer - inner;
            const radialChars = Math.max(4, Math.floor(radialSpan / 7));
            const radialLines = wrapLabel(task.title, radialChars);
            const radialDeg   = (radialLines.length * LINE_H / midR) * (180 / Math.PI);
            const useRadial   = !useCurved && radialDeg <= trimmedSpanDeg;
            const labelPos    = polar(midR, midAng);
            // Keep the rotated label upright — never displayed upside-down.
            let labelRot = midAng;
            if (labelRot > 90) labelRot -= 180;
            else if (labelRot < -90) labelRot += 180;

            return (
              <g key={task.id} onClick={() => onTaskClick(task.id)} style={{ cursor: 'pointer' }}>
                <path
                  d={d} fill={color} stroke="white" strokeWidth="1"
                  opacity={isActive ? 1 : 0.88}
                  className={`task-arc${isActive ? ' active' : ''}`}
                >
                  <title>{task.title} ({rangeLabel})</title>
                </path>
                {useCurved && (
                  <>
                    <defs>
                      {lines.map((_, i) => {
                        const lineR = midR + dir * (i - (lines.length - 1) / 2) * LINE_H;
                        return <path key={i} id={`tp-${task.id}-${i}`} d={makeArcPath(lineR)} />;
                      })}
                    </defs>
                    {lines.map((line, i) => (
                      <text key={i}
                        fontSize="11" fontFamily="system-ui,sans-serif" fontWeight="600"
                        fill="white" pointerEvents="none" opacity="0.95" textAnchor="middle"
                      >
                        <textPath href={`#tp-${task.id}-${i}`} startOffset="50%">
                          {line}
                        </textPath>
                      </text>
                    ))}
                  </>
                )}
                {useRadial && (
                  <text
                    x={f(labelPos.x)} y={f(labelPos.y)}
                    transform={`rotate(${f(labelRot)} ${f(labelPos.x)} ${f(labelPos.y)})`}
                    fontSize="11" fontFamily="system-ui,sans-serif" fontWeight="600"
                    fill="white" pointerEvents="none" opacity="0.95" textAnchor="middle"
                  >
                    {radialLines.map((line, i) => (
                      <tspan key={i} x={f(labelPos.x)}
                        dy={i === 0 ? -(radialLines.length - 1) * LINE_H / 2 : LINE_H}
                      >
                        {line}
                      </tspan>
                    ))}
                  </text>
                )}
              </g>
            );
          })}

          {/* ── Centre circle ── */}
          <circle cx={CX} cy={CY} r={CENTER_R} fill="white" stroke="#CDD0D6" strokeWidth="1.5"/>
          <text x={CX} y={CY - 14} textAnchor="middle" dominantBaseline="middle"
            fontSize="18" fontFamily="system-ui,sans-serif" fontWeight="800" fill="#1A1A2E">
            Annual Cycle
          </text>
          <text x={CX} y={CY + 12} textAnchor="middle" dominantBaseline="middle"
            fontSize="12" fontFamily="system-ui,sans-serif" fill="#6C6F7D">
            {year}
          </text>
        </g>
      </svg>

      {/* Zoom controls */}
      <div className="zoom-controls">
        <button className="zoom-btn" title="Zoom in"  onClick={() => zoomBy(1.3)}>+</button>
        <button className="zoom-btn" title="Zoom out" onClick={() => zoomBy(1 / 1.3)}>−</button>
        <button className="zoom-btn zoom-btn-reset" title="Reset zoom" onClick={resetZoom}>⊙</button>
      </div>
    </div>
  );
}
