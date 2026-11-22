import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button, EmptyState } from '../../components/ui';

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20">
      <div className="surface">
        <EmptyState
          icon={Compass}
          title="Page not found"
          description="The page you are looking for doesn't exist or has moved."
          action={<Link to="/"><Button variant="secondary">Back to home</Button></Link>}
        />
      </div>
    </div>
  );
}
