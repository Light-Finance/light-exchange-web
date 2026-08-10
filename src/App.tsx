import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { authStore } from './stores/auth.store';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { Wallet } from './pages/Wallet';
import { AiBot } from './pages/AiBot';

const Protected = observer(() => {
  if (!authStore.isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
});

const PublicOnly = observer(({ children }: { children: JSX.Element }) => {
  if (authStore.isAuthenticated) return <Navigate to="/wallet" replace />;
  return children;
});

export const App = observer(() => {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnly>
              <Login />
            </PublicOnly>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicOnly>
              <SignUp />
            </PublicOnly>
          }
        />
        <Route element={<Protected />}>
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/bot" element={<AiBot />} />
        </Route>
        <Route path="*" element={<Navigate to="/wallet" replace />} />
      </Routes>
    </BrowserRouter>
  );
});
