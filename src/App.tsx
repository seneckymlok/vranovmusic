import { Desktop } from './components/desktop/Desktop';
import { Analytics } from '@vercel/analytics/react';
import './index.css';

function App() {
  return (
    <div className="app no-select">
      <Desktop />
      <Analytics />
    </div>
  );
}

export default App;
