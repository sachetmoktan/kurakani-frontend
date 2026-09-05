import { API_BASE_URL } from '../../constants';
import type { TFetchApiOptions } from '../../types/auth.types';

async function fetchApi<T>(endpoint: string, options: TFetchApiOptions = {}): Promise<T> {
  const { auth = true, method, headers, body, ...rest } = options;
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...rest,
    method: method ? method : 'GET',
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
}

export default fetchApi;
