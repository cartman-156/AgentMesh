import { BrowserRouter } from 'react-router-dom';
import { SessionProvider } from './context/SessionContext';
import { Toaster } from 'react-hot-toast';
import AppRoutes from './routes/AppRoutes';
import Layout from './components/Layout';

const App = () => {
  return (
    <SessionProvider>
      <BrowserRouter>
        <Layout>
          <AppRoutes />
          <Toaster position="top-right" />
        </Layout>
      </BrowserRouter>
    </SessionProvider>
  );
};

export default App;
