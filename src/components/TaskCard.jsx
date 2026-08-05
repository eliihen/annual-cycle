const MONTHS_FULL = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

export default function TaskCard({ task, active, open, onActivate }) {
  const handleHeadClick = () => onActivate(task.id);

  const when = task.unit === 'week'
    ? (task.start_week === task.end_week
      ? `Week ${task.start_week}`
      : `Week ${task.start_week} – ${task.end_week}`)
    : (task.start_month === task.end_month
      ? MONTHS_FULL[task.start_month - 1]
      : `${MONTHS_FULL[task.start_month - 1]} – ${MONTHS_FULL[task.end_month - 1]}`);

  const col = task.displayColor;

  return (
    <article className={`task-card${active ? ' active' : ''}`} id={`card-${task.id}`}>
      <div
        className="task-card-head"
        style={{ borderLeft: `4px solid ${col}` }}
        onClick={handleHeadClick}
      >
        <div className="task-title">{task.title}</div>
        <div className="task-chips">
          <span className="chip chip-cat" style={{ '--c': col }}>{task.category}</span>
          <span className="chip">{when}</span>
          {task.responsible && <span className="chip">👤 {task.responsible}</span>}
          {task.tags.map(tag => <span key={tag} className="chip">{tag}</span>)}
        </div>
      </div>
      {/* processTasks() reports the description as `Body` (a component) when
          the source has no HTML string to give — e.g. MDX/Docusaurus compiles
          bodies to components instead. Prefer it over `html`, and keep the
          html branch's DOM identical to before (dangerouslySetInnerHTML
          directly on .task-body.open) rather than adding a wrapper. */}
      {open && (
        task.Body ? (
          <div className="task-body open"><task.Body /></div>
        ) : (
          <div
            className="task-body open"
            dangerouslySetInnerHTML={{ __html: task.html || '<p><em>No description.</em></p>' }}
          />
        )
      )}
    </article>
  );
}
