import { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import Navbar from './components/Navbar';
import LoadingScreen from './components/LoadingScreen';
import Footer from './components/Footer';
import CommandPalette from './components/CommandPalette';
import Toasts from './components/Toasts';
import { LiveProvider } from './lib/store';

const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Pipelines = lazy(() => import('./pages/Pipelines'));
const Incidents = lazy(() => import('./pages/Incidents'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Lab = lazy(() => import('./pages/Lab'));
const Rank = lazy(() => import('./pages/Rank'));
const OpenConsole = lazy(() => import('./pages/OpenConsole'));
const ApiDocs = lazy(() => import('./pages/ApiDocs'));
const Settings = lazy(() => import('./pages/Settings'));
const Features = lazy(() => import('./pages/InfoPages').then((m) => ({ default: m.Features })));
const WorkflowPage = lazy(() => import('./pages/InfoPages').then((m) => ({ default: m.Workflow })));
const Security = lazy(() => import('./pages/InfoPages').then((m) => ({ default: m.Security })));
const NotFound = lazy(() => import('./pages/InfoPages').then((m) => ({ default: m.NotFound })));

const ScrollTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

function Shell() {
  const [palette, setPalette] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette((v) => !v);
      }
      if (e.key === 'Escape') setPalette(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <ScrollTop />
      <Navbar onPalette={() => setPalette(true)} />
      <main>
        <Suspense fallback={<div className="page" />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/live" element={<Dashboard />} />
            <Route path="/dashboard" element={<Navigate to="/live" replace />} />
            <Route path="/pipelines" element={<Pipelines />} />
            <Route path="/incidents" element={<Incidents />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/lab" element={<Lab />} />
            <Route path="/rank" element={<Rank />} />
            <Route path="/console" element={<OpenConsole />} />
            <Route path="/api-docs" element={<ApiDocs />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/features" element={<Features />} />
            <Route path="/workflow" element={<WorkflowPage />} />
            <Route path="/security" element={<Security />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <AnimatePresence>{palette && <CommandPalette key="palette" onClose={() => setPalette(false)} />}</AnimatePresence>
      <Toasts />
    </>
  );
}

export default function App() {
  const [booted, setBooted] = useState(() => {
    try {
      return sessionStorage.getItem('ls.booted') === '1';
    } catch {
      return false;
    }
  });

  return (
    <LiveProvider>
      <Router>
        <AnimatePresence>
          {!booted && (
            <LoadingScreen
              key="boot"
              onDone={() => {
                try {
                  sessionStorage.setItem('ls.booted', '1');
                } catch {
                  /* ignore */
                }
                setBooted(true);
              }}
            />
          )}
        </AnimatePresence>
        <Shell />
      </Router>
    </LiveProvider>
  );
}
