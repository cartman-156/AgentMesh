import { BrowserRouter } from 'react-router-dom';
import { SessionProvider } from './context/SessionContext';
import AppRoutes from './routes/AppRoutes';
import Layout from './components/Layout';

const App = () => {
  return (
    <SessionProvider>
      <BrowserRouter>
        <Layout>
          <AppRoutes />
        </Layout>
      </BrowserRouter>
    </SessionProvider>
  );
};

export default App;
