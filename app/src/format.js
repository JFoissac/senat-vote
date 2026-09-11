const nf = new Intl.NumberFormat("fr-FR");
const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric"
});
const dateShort = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit"
});

export function n(x) {
  return nf.format(x || 0);
}

export function frDate(iso) {
  return iso ? dateFmt.format(new Date(iso + "T12:00:00")) : "";
}

export function frDateShort(iso) {
  return iso ? dateShort.format(new Date(iso + "T12:00:00")) : "";
}

export function byDateDesc(a, b) {
  return (b.date || "").localeCompare(a.date || "");
}

export function capFirst(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}
