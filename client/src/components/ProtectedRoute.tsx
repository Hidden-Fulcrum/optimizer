import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PinLogin } from './PinLogin';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowLogin(true);
    } else {
      setShowLogin(false);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <PinLogin open={showLogin} onOpenChange={setShowLogin} />;
  }

  return <>{children}</>;
}
