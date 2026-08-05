import { useMemo } from 'react';
import AnnualCycleApp from './components/AnnualCycleApp.jsx';
import { processTasks } from './utils/tasks.js';

const taskModules = import.meta.glob('../tasks/*.md', { eager: true });

export default function App() {
  const tasks = useMemo(() => processTasks(taskModules), []);
  return <AnnualCycleApp tasks={tasks} />;
}
