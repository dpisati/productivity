import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Meta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function Pagination({ meta, onPage }: { meta: Meta; onPage: (page: number) => void }) {
  if (meta.total === 0) return null;
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
      <span>
        {meta.total} item{meta.total === 1 ? '' : 's'}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          disabled={meta.page <= 1}
          onClick={() => onPage(meta.page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span>
          Page {meta.page} of {Math.max(1, meta.totalPages)}
        </span>
        <Button
          variant="outline"
          size="icon"
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPage(meta.page + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
