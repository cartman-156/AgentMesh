import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

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

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <aside style={{ width: '250px', backgroundColor: '#ffffff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>AgentMesh</h1>
        </div>
        <nav style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  color: isActive ? '#2563eb' : '#475569',
                  backgroundColor: isActive ? '#eff6ff' : 'transparent',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'all 0.2s',
                  display: 'block'
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
