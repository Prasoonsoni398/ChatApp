import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Redirects authenticated users away from public pages (login, register, home).
 * If a valid JWT token exists in localStorage, the user is sent to `redirectTo`.
 *
 * @param {string} redirectTo - Path to redirect to when already logged in (default '/chat').
 */
function useAuthRedirect(redirectTo = '/chat') {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate(redirectTo);
    }
  }, [navigate, redirectTo]);
}

export default useAuthRedirect;
