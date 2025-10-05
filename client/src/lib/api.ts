
export async function apiFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('authToken');

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && options.body) {
    headers.append('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token is invalid or expired, log the user out
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    // Redirect to login page
    window.location.href = '/login';
    // Throw an error to stop further processing
    throw new Error('Unauthorized');
  }

  return response;
}
