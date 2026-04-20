const ISO_DATE_TIME_REGEX = /\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})\b/g;
const ISO_DATE_REGEX = /\b\d{4}-\d{2}-\d{2}\b/g;

const toReadableDateTime = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
};

const toReadableDate = (value) => {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
};

export const formatNotificationMessage = (message) => {
  if (!message) return '';

  const withFormattedDateTimes = String(message).replace(
    ISO_DATE_TIME_REGEX,
    (match) => toReadableDateTime(match),
  );

  return withFormattedDateTimes.replace(
    ISO_DATE_REGEX,
    (match) => toReadableDate(match),
  );
};
