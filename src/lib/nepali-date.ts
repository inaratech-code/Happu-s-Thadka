import NepaliDate from "nepali-date-converter";

export type TodayDates = {
  /** e.g. Monday 25 May */
  englishTitle: string;
  /** e.g. 25 May 2026 */
  englishFull: string;
  /** Bikram Sambat in Devanagari, e.g. सोमबार ११, जेठ २०८३ बि.सं. */
  nepaliBS: string;
  /** Romanized BS, e.g. Monday 11, Jestha 2083 */
  nepaliBSEn: string;
};

/** Bikram Sambat date string for display (Devanagari) */
export function formatNepaliBS(date = new Date()): string {
  const nd = NepaliDate.fromAD(date);
  return `${nd.format("ddd DD, MMMM YYYY", "np")} बि.सं.`;
}

/** Bikram Sambat date in English month names */
export function formatNepaliBSEn(date = new Date()): string {
  const nd = NepaliDate.fromAD(date);
  return `${nd.format("ddd DD, MMMM YYYY")} (B.S.)`;
}

export function getTodayDates(date = new Date()): TodayDates {
  const englishTitle = date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const englishFull = date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const nd = NepaliDate.fromAD(date);

  return {
    englishTitle,
    englishFull,
    nepaliBS: `${nd.format("ddd DD, MMMM YYYY", "np")} बि.सं.`,
    nepaliBSEn: `${nd.format("ddd DD, MMMM YYYY")} (B.S.)`,
  };
}
