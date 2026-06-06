import React, { useRef, useState, useCallback, useEffect } from 'react';

// ── Geometry constants ────────────────────────────────────────────────────────
const SVG_SIZE   = 980;
const CX         = SVG_SIZE / 2;   // 490
const CY         = SVG_SIZE / 2;   // 490

// Outer display ring (week date labels + month names)
const WEEK_OUTER_R   = 460;  // outer edge of outer ring
const WEEK_SPLIT_R   = 420;  // inner boundary of month-name sub-ring
const OUTER_R        = 385;  // inner edge of outer ring / outer edge of task area

// Inner task area
const LABEL_RING_INNER = 318;
const TASK_OUTER_START = 308;
const TASK_BAND        = 46;
const TASK_GAP         = 4;
const CENTER_R         = 95;
const MAX_RINGS        = 4;

// Text radii
const WEEK_DATE_R  = (OUTER_R + WEEK_SPLIT_R) / 2;   // ≈ 402.5
const MONTH_NAME_R = (WEEK_SPLIT_R + WEEK_OUTER_R) / 2; // ≈ 440

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

// Build array of { label: "9–15" } for all 52 weeks
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

// ── Zoom/pan hook ─────────────────────────────────────────────────────────────
function useZoomPan(svgRef) {
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const dragging = useRef(false);
  const lastPos  = useRef({ x: 0, y: 0 });

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
    dragging.current = true;
    lastPos.current  = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback(e => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setTransform(t => ({ ...t, x: t.x + dx, y: t.y + dy }));
  }, []);

  const onPointerUp = useCallback(() => { dragging.current = false; }, []);

  const resetZoom = useCallback(() => setTransform({ x: 0, y: 0, scale: 1 }), []);

  const zoomBy = useCallback(factor => {
    setTransform(t => {
      const scale = Math.min(Math.max(t.scale * factor, 0.4), 6);
      // zoom toward the centre of the SVG element
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
export default function Wheel({ tasks, activeId, onTaskClick }) {
  const svgRef   = useRef(null);
  const now      = new Date();
  const curMonth = now.getMonth() + 1;
  const curWeek  = isoWeek(now);
  const year     = now.getFullYear();
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
            return <path key={m} d={annularSector(LABEL_RING_INNER, CENTER_R, mStart(m), mEnd(m), 0)} fill={fill} stroke="none"/>;
          })}

          {/* ── Old month-label ring now just background ── */}
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
            const isCurrent = m === curMonth;
            const fill = isCurrent ? '#A8CBF0' : (m % 2 === 0 ? '#D0D5DF' : '#D8DCE8');
            return <path key={m} d={annularSector(OUTER_R, LABEL_RING_INNER, mStart(m), mEnd(m), 0)} fill={fill} stroke="none"/>;
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
            const inner = polar(OUTER_R,     ang);
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
                fontSize="7.5"
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
                fontSize="11"
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
            const outer = polar(WEEK_OUTER_R,  ang);
            return <line key={m} x1={f(inner.x)} y1={f(inner.y)} x2={f(outer.x)} y2={f(outer.y)} stroke="white" strokeWidth="1.8"/>;
          })}

          {/* ── Quarter markers (bolder) ── */}
          {Array.from({ length: 4 }, (_, i) => i).map(q => {
            const ang   = -90 + q * 90;
            const inner = polar(CENTER_R,     ang);
            const outer = polar(WEEK_OUTER_R,  ang);
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
            const d        = annularSector(outer, inner, startDeg, endDeg, 2);
            const isActive = task.id === activeId;
            const rangeLabel = task.unit === 'week'
              ? `Week ${task.start_week}–${task.end_week}`
              : `${MONTHS_SHORT[task.start_month - 1]}–${MONTHS_SHORT[task.end_month - 1]}`;

            const midAng  = (startDeg + endDeg) / 2;
            const midR    = (outer + inner) / 2;
            const tp      = polar(midR, midAng);
            const rot     = midAng + 90;
            const maxChars = Math.max(4, Math.floor(spanDeg / 8));
            const label   = task.title.length > maxChars
              ? task.title.slice(0, maxChars - 1) + '…'
              : task.title;

            return (
              <g key={task.id} onClick={() => onTaskClick(task.id)} style={{ cursor: 'pointer' }}>
                <path
                  d={d} fill={color} stroke="white" strokeWidth="1"
                  opacity={isActive ? 1 : 0.88}
                  className={`task-arc${isActive ? ' active' : ''}`}
                >
                  <title>{task.title} ({rangeLabel})</title>
                </path>
                {spanDeg >= 60 && (
                  <text
                    transform={`translate(${f(tp.x)},${f(tp.y)}) rotate(${f(rot)})`}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize="10" fontFamily="system-ui,sans-serif" fontWeight="600"
                    fill="white" pointerEvents="none" opacity="0.95"
                  >
                    {label}
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
