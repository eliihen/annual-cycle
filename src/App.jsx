import React, { useState, useMemo } from 'react';
import Wheel from './components/Wheel.jsx';
import TaskCard from './components/TaskCard.jsx';
import { processTasks, categoryColor } from './utils/tasks.js';

const taskModules = import.meta.glob('../tasks/*.md', { eager: true });

export default function App() {
  const allTasks = useMemo(() => processTasks(taskModules), []);

  const [activeId,  setActiveId]  = useState(null);
  const [search,    setSearch]    = useState('');
  const [catFilter, setCatFilter] = useState('all');

  const categories = useMemo(() => {
    const seen = new Map();
    for (const t of allTasks) {
      if (!seen.has(t.category)) seen.set(t.category, t.displayColor);
    }
    return seen;
  }, [allTasks]);

  const visibleTasks = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allTasks.filter(t => {
      if (catFilter !== 'all' && t.category !== catFilter) return false;
      if (q && !t.title.toLowerCase().includes(q) &&
               !t.category.toLowerCase().includes(q) &&
               !(t.responsible || '').toLowerCase().includes(q) &&
               !t.tags.some(tag => tag.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [allTasks, search, catFilter]);

  const handleTaskClick = id => {
    setActiveId(id);
    const el = document.getElementById(`card-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  return (
    <>
      <header>
        <h1>Annual Cycle</h1>
        <p>Overview of recurring tasks throughout the year</p>
      </header>

      <div className="layout">
        {/* Wheel panel */}
        <div className="wheel-panel">
          <Wheel tasks={visibleTasks} activeId={activeId} onTaskClick={handleTaskClick} />
          {categories.size > 0 && (
            <div className="legend">
              {[...categories.entries()].map(([cat, col]) => (
                <div
                  key={cat}
                  className={`legend-item${catFilter === cat ? ' active' : ''}`}
                  onClick={() => setCatFilter(c => c === cat ? 'all' : cat)}
                  title={catFilter === cat ? 'Clear filter' : `Filter by ${cat}`}
                >
                  <span className="legend-dot" style={{ background: col }}/>
                  <span>{cat}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <h2>Tasks</h2>
            <span>{visibleTasks.length} task{visibleTasks.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Search + filter controls */}
          <div className="filter-bar">
            <input
              className="search-input"
              type="search"
              placeholder="Search tasks…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="cat-select"
              value={catFilter}
              onChange={e => setCatFilter(e.target.value)}
            >
              <option value="all">All categories</option>
              {[...categories.keys()].map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="task-list">
            {visibleTasks.length > 0
              ? visibleTasks.map(t => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    active={t.id === activeId}
                    onActivate={handleTaskClick}
                  />
                ))
              : (
                <div className="empty">
                  <strong>{search || catFilter !== 'all' ? 'No matching tasks' : 'No tasks yet'}</strong>
                  {search || catFilter !== 'all'
                    ? 'Try a different search or filter.'
                    : <>Add <code>.md</code> files to the <code>tasks/</code> folder and run <code>npm run build</code>.</>
                  }
                </div>
              )
            }
          </div>
        </aside>
      </div>

      <footer>
        Annual Cycle · {new Date().getFullYear()}
      </footer>
    </>
  );
}
