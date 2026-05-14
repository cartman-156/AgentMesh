import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

type IconProps = {
  className?: string;
};

const SunIcon = ({ className }: IconProps) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
  </svg>
);

const MoonIcon = ({ className }: IconProps) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const navItems = [
  { path: '/', label: 'Dashboard' },
  { path: '/agents', label: 'Registry' },
  { path: '/register', label: 'Register Agent' },
  { path: '/search', label: 'Search' },
  { path: '/health', label: 'System Health' },
  { path: '/debug', label: 'Debug' },
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
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="main-view">
          <div className="main-content">{children}</div>
        </main>
      </div>

      <footer className="main-footer">
        <p className="main-footer__text">AgentMesh — Built with React and TypeScript</p>
      </footer>
    </div>
  );
};

export default Layout;
