import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const Index = () => {
  const { currentUser, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    if (!currentUser) {
      navigate('/login', { replace: true });
    } else if (currentUser.role === 'admin') {
      navigate('/admin', { replace: true });
    } else {
      navigate('/shop', { replace: true });
    }
  }, [currentUser, isLoading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#2563EB] border-t-transparent" />
    </div>
  );
};

export default Index;