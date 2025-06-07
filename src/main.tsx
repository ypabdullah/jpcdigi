import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { TransactionProvider } from './contexts/TransactionContext'

createRoot(document.getElementById("root")!).render(
  <TransactionProvider>
    <App />
  </TransactionProvider>
);
