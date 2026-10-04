import axios from 'axios';

export const getApiErrorMessage = (err: unknown, fallback: string): string => {
  if (!axios.isAxiosError(err)) {
    return fallback;
  }

  const data = err.response?.data;

  if (typeof data === 'string' && data.trim()) {
    return data;
  }

  if (!data || typeof data !== 'object') {
    return fallback;
  }

  const payload = data as Record<string, unknown>;

  if (typeof payload.error === 'string' && payload.error.trim()) {
    return payload.error;
  }

  if (typeof payload.message === 'string' && payload.message.trim()) {
    return payload.message;
  }

  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    const first = payload.errors[0];

    if (typeof first === 'string' && first.trim()) {
      return first;
    }

    if (
      first &&
      typeof first === 'object' &&
      'msg' in first &&
      typeof first.msg === 'string' &&
      first.msg.trim()
    ) {
      return first.msg;
    }
  }

  return fallback;
};
