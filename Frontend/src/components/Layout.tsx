import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  SunIcon,
  MoonIcon,
  DashboardIcon,
  RegistryIcon,
  SearchIcon,
  HealthIcon,
  DebugIcon,
} from '../utils/icons';

type NavItem = {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: DashboardIcon },
  { path: '/agents', label: 'Registry', icon: RegistryIcon },
  { path: '/search', label: 'Search', icon: SearchIcon },
  { path: '/health', label: 'System Health', icon: HealthIcon },
  { path: '/debug', label: 'Debug', icon: DebugIcon },
];

const Layout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => setTheme((current) => (current === 'light' ? 'dark' : 'light'));
  const currentThemeLabel = theme === 'light' ? 'Dark Mode' : 'Light Mode';

  return (
    <div className="app-shell">
      <header className="main-header">
        <div className="main-header__content">
          <h1 className="main-header__title">AgentMesh</h1>
          <button
            type="button"
            className="mode-switch"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <MoonIcon className="mode-switch__icon" /> : <SunIcon className="mode-switch__icon" />}
          </button>
        </div>
      </header>

      <div className="app-content">
        <aside className="sidebar">
          <nav className="nav-list">
            {navItems.map((item) => {
              const isActive =
                location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                  title={item.label}
                >
                  <IconComponent className="nav-link__icon" />
                  <span className="nav-link__label">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="main-view">
          <div className="main-content">{children}</div>
        </main>
      </div>

      <footer className="footer">
        <div className="footer-content">
          <p className="footer-text">
            <span className="footer-brand">© 2026 AgentMesh</span>
            <span className="footer-divider">;</span>
            <span className="footer-company">Semicolons</span>
            <span className="footer-divider">;</span>
            <span className="footer-tagline">Designed, Built, and Maintained by Agent Architects</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
