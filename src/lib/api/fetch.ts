import { API_BASE_URL } from '../../constants';

type TFetchApiOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: HeadersInit;
  credentials?: RequestCredentials;
};

async function fetchApi<T>(endpoint: string, options: TFetchApiOptions = {}): Promise<T> {
  const { method, headers, body, ...rest } = options;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...rest,
    method: method ? method : 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...(!!body && {
      body: JSON.stringify(body),
    }),
    // for session-based authentication
    credentials: 'include',
  });

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errMsg =
      typeof data === 'object' && data !== null && 'message' in data
        ? String(data.message)
        : `Request failed with status ${response.status}`;

    throw new Error(errMsg);
  }

  return data as T;
}

export default fetchApi;
