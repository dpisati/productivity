/**
 * cn — tiny class-name combiner. Replaced with clsx + tailwind-merge when
 * shadcn/ui components are added in M6.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
