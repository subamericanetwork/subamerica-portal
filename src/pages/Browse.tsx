import { CatalogBrowser } from '@/components/CatalogBrowser';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MemberLayout } from '@/components/layout/MemberLayout';

export default function Browse() {
  const navigate = useNavigate();

  return (
    <MemberLayout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted">
        <div className="container mx-auto px-4 py-8">
...
        </div>
      </div>
    </MemberLayout>
  );
}
