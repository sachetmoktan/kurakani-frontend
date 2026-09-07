import { API_BASE_URL } from '../../constants';
import type { TFetchApiOptions } from '../../types/auth.types';

const REQUEST_TIMEOUT = 30_000; // 30sec

async function fetchApi<T>(endpoint: string, options: TFetchApiOptions = {}): Promise<T> {
  const { auth = true, method, headers, body, signal: externalSignal, ...rest } = options;
  const token = localStorage.getItem('token');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT);

  // If caller provides their own AbortSignal, abort our controller as well.
  const handleExternalAbort = () => {
    controller.abort();
  };

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', handleExternalAbort);
    }
  }
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...rest,
      method: method ? method : 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(auth && token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),
        ...headers,
      },
      ...(!!body && {
        body: JSON.stringify(body),
      }),
    });

    let data: unknown;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      let errMsg;
      if (typeof data === 'object' && data !== null) {
        if ('errors' in data && Array.isArray(data.errors)) {
          errMsg = `${data.errors[0].message}`;
        } else {
          errMsg =
            typeof data === 'object' && data !== null && 'message' in data
              ? String(data.message)
              : `Request failed with status ${response.status}`;
        }
      }

      throw new Error(errMsg);
    }

    return data as T;
  } finally {
    clearTimeout(timeoutId);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', handleExternalAbort);
    }
  }
}

export default fetchApi;
