import { useState, useMemo } from 'react';
import Wheel from './components/Wheel.jsx';
import { processTasks } from './utils/tasks.js';

const taskModules = import.meta.glob('../tasks/*.md', { eager: true });

// Injected at build time by Vite define; override with IFRAME_LINK_TARGET env var.
const LINK_BASE = __IFRAME_LINK_TARGET__;

const THIS_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 8 }, (_, i) => THIS_YEAR - 1 + i);

export default function IframeApp() {
  const allTasks = useMemo(() => processTasks(taskModules), []);
  const [activeId, setActiveId] = useState(null);
  const [year, setYear] = useState(THIS_YEAR);

  const handleTaskClick = id => {
    setActiveId(cur => cur === id ? null : id);
    // Always navigate the top frame — breaks out of any iframe.
    // Falls back to './' (same directory as the iframe file) when no explicit
    // LINK_BASE was baked in at build time.
    window.open(LINK_BASE || './', '_top');
  };

  return (
    <div className="iframe-root">
      <Wheel
        tasks={allTasks}
        activeId={activeId}
        onTaskClick={handleTaskClick}
        year={year}
      />
      <div className="iframe-year-ctrl">
        <select
          value={year}
          onChange={e => setYear(Number(e.target.value))}
          aria-label="Select year"
        >
          {YEAR_OPTIONS.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
