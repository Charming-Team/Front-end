export function formatKg(value) {
  return `${Number(value).toLocaleString("ko-KR")} kg`;
}

export function getVisiblePages(currentPage, pageCount) {
  if (pageCount <= 5) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const start = Math.max(1, Math.min(currentPage - 2, pageCount - 4));
  return Array.from({ length: 5 }, (_, index) => start + index);
}

export function buildLineOptions(items) {
  return [
    { value: "all", label: "전체 라인" },
    ...items.map((item) => ({ value: item.id, label: item.name })),
  ];
}
