import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';

/** Temporary page for routes whose full UI lands in M7. */
export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div>
      <PageHeader title={title} />
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          The {title} page is coming in the next milestone.
        </CardContent>
      </Card>
    </div>
  );
}
