export type KnowledgePointListItem = {
  id: string;
  content: string;
};

export type PaginatedKnowledgePoint = KnowledgePointListItem & {
  displayIndex: number;
};

export function paginateKnowledgePoints<T extends KnowledgePointListItem>(
  points: T[],
  page: number,
  pageSize: number,
): {
  page: number;
  pageSize: number;
  totalPages: number;
  items: Array<T & { displayIndex: number }>;
} {
  const normalizedPageSize = Math.max(1, Math.floor(pageSize));
  const totalPages = Math.max(1, Math.ceil(points.length / normalizedPageSize));
  const currentPage = Math.min(Math.max(1, Math.floor(page)), totalPages);
  const start = (currentPage - 1) * normalizedPageSize;
  const items = points
    .slice(start, start + normalizedPageSize)
    .map((point, index) => ({
      ...point,
      displayIndex: start + index + 1,
    }));

  return {
    page: currentPage,
    pageSize: normalizedPageSize,
    totalPages,
    items,
  };
}
