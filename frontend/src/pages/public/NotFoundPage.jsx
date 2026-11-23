import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button, EmptyState } from '../../components/ui';
import { useT } from '../../hooks';

export default function NotFoundPage() {
  const { t } = useT();
  return (
    <div className="mx-auto max-w-lg px-4 py-20">
      <div className="surface">
        <EmptyState
          icon={Compass}
          title={t('notFound.title')}
          description={t('notFound.body')}
          action={<Link to="/"><Button variant="secondary">{t('notFound.home')}</Button></Link>}
        />
      </div>
    </div>
  );
}
