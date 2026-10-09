export type ProgramStatus = "upcoming" | "completed";

const dateKeyInIst = (date: Date) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? "00";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}:${part("second")}`;
};

export function programStatus(date: string, time: string, now = new Date(), legacyStatus: string = "upcoming"): ProgramStatus {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return legacyStatus === "completed" ? "completed" : "upcoming";
  }
  return `${date}T${time}:00` > dateKeyInIst(now) ? "upcoming" : "completed";
}

export function isIsoProgramDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function isIsoProgramTime(value: string): boolean {
  return /^\d{2}:\d{2}$/.test(value);
}