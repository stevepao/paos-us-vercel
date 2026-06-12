import Link from "next/link";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  basePath: string;
};

export function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const previousPage = currentPage - 1;
  const nextPage = currentPage + 1;

  return (
    <nav
      className="mt-10 flex items-center justify-between gap-4 border-t border-paos-line pt-6 font-condensed text-sm uppercase tracking-[0.08em]"
      aria-label="Pagination"
    >
      {previousPage >= 1 ? (
        <Link className="text-paos-orange transition hover:text-paos-ink" href={pageHref(basePath, previousPage)}>
          Newer posts
        </Link>
      ) : (
        <span />
      )}
      <span className="text-paos-muted">
        Page {currentPage} of {totalPages}
      </span>
      {nextPage <= totalPages ? (
        <Link className="text-paos-orange transition hover:text-paos-ink" href={pageHref(basePath, nextPage)}>
          Older posts
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

function pageHref(basePath: string, page: number): string {
  return page === 1 ? basePath : `${basePath}?page=${page}`;
}
