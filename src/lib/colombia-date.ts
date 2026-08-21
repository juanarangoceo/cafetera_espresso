const COLOMBIA_OFFSET_MS = 5 * 60 * 60 * 1000;

function parts(value: string) {
  const colombiaTime = new Date(new Date(value).getTime() - COLOMBIA_OFFSET_MS);
  return {
    day: String(colombiaTime.getUTCDate()).padStart(2, '0'),
    month: String(colombiaTime.getUTCMonth() + 1).padStart(2, '0'),
    year: colombiaTime.getUTCFullYear(),
    hour: String(colombiaTime.getUTCHours()).padStart(2, '0'),
    minute: String(colombiaTime.getUTCMinutes()).padStart(2, '0'),
  };
}

export function formatColombiaDate(value: string) {
  const date = parts(value);
  return `${date.day}/${date.month}/${date.year}`;
}

export function formatColombiaDateTime(value: string) {
  const date = parts(value);
  return `${date.day}/${date.month}/${date.year} ${date.hour}:${date.minute}`;
}
