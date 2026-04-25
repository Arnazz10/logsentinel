import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Layout, Activity, Shield, Workflow, Terminal, BookOpen, Layers, Menu, X, ChevronRight, BarChart3, Database, Zap, Bell } from 'lucide-react';

// Components
import Navbar from './components/Navbar';
import LoadingScreen from './components/LoadingScreen';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import { Features, Workflow as WorkflowPage, Security } from './pages/InfoPages';
import Dashboard from './pages/Dashboard';
import ApiDocs from './pages/ApiDocs';
import OpenConsole from './pages/OpenConsole';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate a loading period for the branding effect
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Router>
      <AnimatePresence mode="wait">
        {loading ? (
          <LoadingScreen key="loading" />
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="min-h-screen bg-grid"
          >
            <div className="relative z-10">
              <Navbar />
              <main>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/features" element={<Features />} />
                  <Route path="/workflow" element={<WorkflowPage />} />
                  <Route path="/security" element={<Security />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/api-docs" element={<ApiDocs />} />
                  <Route path="/console" element={<OpenConsole />} />
                </Routes>
              </main>
              <Footer />
            </div>
            
            {/* Background Glows */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
              <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-accent-red opacity-[0.08] blur-[120px]" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent-orange opacity-[0.05] blur-[120px]" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Router>
  );
}

export default App;
