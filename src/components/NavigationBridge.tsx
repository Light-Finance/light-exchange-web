import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setNavigator } from '../navigations/app.navigation';

/**
 * Hands react-router's navigate to the navigation shim, so ported stores can
 * keep calling `navigate(ROUTES...)` outside of React. Must be rendered inside
 * the router.
 */
export const NavigationBridge = () => {
  const navigate = useNavigate();
  useEffect(() => {
    setNavigator((path, options) => navigate(path, options));
    return () => setNavigator(null);
  }, [navigate]);
  return null;
};
