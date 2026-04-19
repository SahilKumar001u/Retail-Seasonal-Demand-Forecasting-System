import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Upload, TrendingUp, BarChart3, Settings, HelpCircle, LogOut, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const menuItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/upload', icon: Upload, label: 'Upload' },
    { path: '/forecast', icon: TrendingUp, label: 'Forecast' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">📊</div>
          <span className="logo-text">Retail Forecast Pro</span>
        </div>
      </div>

      <div className="sidebar-menu">
        <div className="menu-section">
          <div className="menu-label">Menu</div>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`menu-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="menu-section">
          <div className="menu-label">Preferences</div>
          <div className="menu-item" onClick={toggleTheme} style={{ cursor: 'pointer' }}>
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
