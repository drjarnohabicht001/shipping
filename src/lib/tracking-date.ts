export type TimestampLike =
  | Date
  | string
  | number
  | {
      seconds?: number;
      nanoseconds?: number;
      _seconds?: number;
      _nanoseconds?: number;
      toDate?: () => Date;
      toMillis?: () => number;
    }
  | null
  | undefined;

export function toDateValue(timestamp: TimestampLike): Date | null {
  if (!timestamp) {
    return null;
  }

  if (timestamp instanceof Date) {
    return Number.isNaN(timestamp.getTime()) ? null : timestamp;
  }

  if (typeof timestamp === "string" || typeof timestamp === "number") {
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof timestamp === "object") {
    if (typeof timestamp.toDate === "function") {
      const date = timestamp.toDate();
      return Number.isNaN(date.getTime()) ? null : date;
    }

    if (typeof timestamp.toMillis === "function") {
      const date = new Date(timestamp.toMillis());
      return Number.isNaN(date.getTime()) ? null : date;
    }

    if (typeof timestamp.seconds === "number") {
      const date = new Date(timestamp.seconds * 1000);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    if (typeof timestamp._seconds === "number") {
      const date = new Date(timestamp._seconds * 1000);
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }

  return null;
}

export function toTimestampMillis(timestamp: TimestampLike): number | null {
  const date = toDateValue(timestamp);
  return date ? date.getTime() : null;
}

export function formatTrackingDate(
  timestamp: TimestampLike,
  options?: Intl.DateTimeFormatOptions,
  locale?: string
) {
  const date = toDateValue(timestamp);
  if (!date) {
    return "N/A";
  }

  return date.toLocaleDateString(locale, options);
}

export function formatTrackingDateTime(
  timestamp: TimestampLike,
  options?: Intl.DateTimeFormatOptions,
  locale?: string
) {
  const date = toDateValue(timestamp);
  if (!date) {
    return "N/A";
  }

  return date.toLocaleString(locale, options);
}

export function formatTrackingInputDate(timestamp: TimestampLike) {
  const date = toDateValue(timestamp);
  if (!date) {
    return "";
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseTrackingInputDateValue(value: string) {
  if (!value) {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  const [, year, month, day] = match;
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    12,
    0,
    0,
    0
  );
  return Number.isNaN(date.getTime()) ? null : date;
}
