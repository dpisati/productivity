import type { CategoryType } from '@productivity/shared';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCategories } from '@/features/categories/hooks';

const NONE = '__none__';

/** Category picker for a given type. Emits `undefined` when "None" is chosen. */
export function CategorySelect({
  type,
  value,
  onChange,
  includeNone = true,
}: {
  type: CategoryType;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  includeNone?: boolean;
}) {
  const { data: categories } = useCategories(type);

  return (
    <Select
      value={value ?? NONE}
      onValueChange={(v) => onChange(v === NONE ? undefined : v)}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select category" />
      </SelectTrigger>
      <SelectContent>
        {includeNone && <SelectItem value={NONE}>No category</SelectItem>}
        {categories?.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
