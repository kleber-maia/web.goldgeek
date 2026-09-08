'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
export type HistoryPaginationProps = { page: number; hasMore: boolean };
export default function HistoryPagination({ page, hasMore }: HistoryPaginationProps) {
  const pathname = usePathname();
  const search = useSearchParams();
  const href = (target: number) => {
    const params = new URLSearchParams(search.toString());
    params.set('page', String(target));
    return `${pathname}?${params}`;
  };
  if (page === 1 && !hasMore) return null;
  return <nav aria-label="History pages" className="flex items-center justify-between gap-4 py-6">
    {page > 1 ? <Link href={href(page - 1)} className="underline">Previous</Link> : <span />}
    <span>Page {page}</span>
    {hasMore ? <Link href={href(page + 1)} className="underline">Next</Link> : <span />}
  </nav>;
}
