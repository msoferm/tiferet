import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LayoutDashboard, Users, Heart, DollarSign, Calendar, Bell, Receipt, Target, LogOut, ChevronRight, ChevronLeft, Building2, Menu, X, Globe } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Donors from './pages/Donors';
import Donations from './pages/Donations';
import Events from './pages/Events';
import Reminders from './pages/Reminders';
import Expenses from './pages/Expenses';
import Campaigns from './pages/Campaigns';
import LandingPages from './pages/LandingPages';
import LoginPage from './pages/LoginPage';
import DonatePage from './pages/DonatePage';
import DailyPopup from './components/DailyPopup';
import './App.css';

const NAV = [
  { id: 'dashboard', label: 'לוח בקרה', icon: LayoutDashboard, color: '#3b82f6' },
  { id: 'members', label: 'חברי קהילה', icon: Users, color: '#10b981' },
  { id: 'donors', label: 'תורמים', icon: Heart, color: '#ec4899' },
  { id: 'donations', label: 'תרומות', icon: DollarSign, color: '#f59e0b' },
  { id: 'campaigns', label: 'קמפיינים', icon: Target, color: '#8b5cf6' },
  { id: 'landingpages', label: 'דפי תרומות', icon: Globe, color: '#0891b2' },
  { id: 'events', label: 'אירועים', icon: Calendar, color: '#06b6d4' },
  { id: 'reminders', label: 'תזכורות', icon: Bell, color: '#ef4444' },
  { id: 'expenses', label: 'הוצאות', icon: Receipt, color: '#64748b' },
];

const PAGES = { dashboard: Dashboard, members: Members, donors: Donors, donations: Donations, campaigns: Campaigns, landingpages: LandingPages, events: Events, reminders: Reminders, expenses: Expenses };

function AdminApp() {
  const { user, logout, loading } = useAuth();
  const [page, setPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handlePageChange = (p) => { setPage(p); setMobileMenuOpen(false); };

  if (loading) return <div className="loading-screen"><div className="spinner" /><p>טוען...</p></div>;
  if (!user) return <LoginPage />;

  const Page = PAGES[page] || Dashboard;

  return (
    <div className="app-container">
      <DailyPopup />
      <div className="mobile-header">
        <h1>🕎 תפארת</h1>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>{mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}</button>
      </div>
      {mobileMenuOpen && <div className="mobile-overlay show" onClick={() => setMobileMenuOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          {sidebarOpen && <div className="logo-content"><div className="logo-icon"><Building2 size={22} color="white" /></div><div><div className="logo-title">תפארת</div><div className="logo-sub">ניהול בית חב"ד</div></div></div>}
          <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>{sidebarOpen ? <ChevronRight size={16}/> : <ChevronLeft size={16}/>}</button>
        </div>
        <nav className="sidebar-nav">
          {NAV.map(n => (
            <button key={n.id} className={`nav-item ${page === n.id ? 'active' : ''}`} onClick={() => handlePageChange(n.id)} title={!sidebarOpen ? n.label : undefined}>
              <div className="nav-icon" style={{ background: page === n.id ? n.color : 'transparent' }}><n.icon size={20} color={page === n.id ? 'white' : n.color} /></div>
              {(sidebarOpen || mobileMenuOpen) && <span className="nav-label">{n.label}</span>}
            </button>
          ))}
        </nav>
        {(sidebarOpen || mobileMenuOpen) && (
          <div className="sidebar-footer">
            <span className="user-name">🕎 {user.display_name}</span>
            <button className="logout-btn" onClick={logout}><LogOut size={16} /></button>
          </div>
        )}
      </aside>
      <main className={`main-content ${sidebarOpen ? 'sb-open' : 'sb-closed'}`}>
        <div className="page-wrapper" key={page}><Page setPage={handlePageChange} /></div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/donate/:slug" element={<DonatePage />} />
          <Route path="/donate/a/:ambassadorSlug" element={<DonatePage />} />
          <Route path="/*" element={<AdminApp />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
