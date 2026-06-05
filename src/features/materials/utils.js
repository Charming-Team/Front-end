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

export function formatMaterialQuantity(value, unit) {
  const number = Number(value);
  const formatted = Number.isFinite(number)
    ? new Intl.NumberFormat("ko-KR", {
        maximumFractionDigits: 4,
      }).format(number)
    : "-";

  return unit ? `${formatted} ${unit}` : formatted;
}

const materialTypeLabels = {
  ADDITIVE: "첨가제",
  BASE_RESIN: "기본 수지",
  COLORANT: "착색제",
  PACKAGING: "포장재",
  PROCESS_AID: "공정 보조제",
};

export function formatMaterialType(value) {
  return materialTypeLabels[value] ?? value ?? "-";
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
