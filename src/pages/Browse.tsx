import { CatalogBrowser } from '@/components/CatalogBrowser';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Browse() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-3xl font-bold mb-2">Browse Catalog</h1>
            <p className="text-muted-foreground">
              Explore music from SubAmerica artists
            </p>
          </div>
        </div>

        <CatalogBrowser mode="standalone" />
      </div>
    </div>
  );
}
