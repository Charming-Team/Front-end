export function createDefaultForm() {
  return {
    id: "",
    name: "",
    product: "",
    incomingStock: "",
    orderCost: "",
  };
}

export function formatKg(value) {
  return `${new Intl.NumberFormat("ko-KR").format(value)} kg`;
}

export function getPercentage(material) {
  return (
    Number.parseInt(
      String(material.levelLabel ?? "0").replace(/[^\d]/g, ""),
      10,
    ) || 0
  );
}

export function parseNumber(value) {
  return Number(String(value ?? "").replace(/[^\d.-]/g, "")) || 0;
}

export function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

export function findCatalogMatch(catalog, field, value) {
  const normalizedValue = normalizeText(value);
  if (!normalizedValue) return null;

  return (
    catalog.find((item) => normalizeText(item[field]) === normalizedValue) ??
    null
  );
}
