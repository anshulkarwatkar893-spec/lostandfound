import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ItemForm } from '@/components/items/ItemForm';
import { useAuth } from '@/hooks/useAuth';

export default function PostFound() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <ItemForm type="found" />
    </Layout>
  );
}
