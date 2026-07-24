
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '—';

  const defaultOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options
  };

  return date.toLocaleDateString('en-GB', defaultOptions);
};

export const formatDateTime = (dateString, options = {}) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '—';

  const defaultOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    ...options
  };

  return date.toLocaleString('en-GB', defaultOptions);
};

export const formatFullDate = (dateString = new Date()) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};
