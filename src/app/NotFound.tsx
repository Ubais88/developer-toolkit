import { Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, EmptyState, Kbd } from '../components/ui';

export function NotFound() {
  const navigate = useNavigate();
  return (
    <EmptyState
      icon={<Compass />}
      title="This page doesn't exist"
      hint={
        <span className="inline-flex items-center gap-1.5">
          Head back home or press <Kbd combo="mod+k" size="sm" /> to search every tool.
        </span>
      }
      action={
        <Button size="sm" onClick={() => navigate('/')}>
          Go home
        </Button>
      }
    />
  );
}
