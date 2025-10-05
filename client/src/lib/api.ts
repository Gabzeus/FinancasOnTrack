
const getToken = () => localStorage.getItem('authToken');

const api = {
  get: async (url: string) => {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    });
    if (!response.ok) {
      if (response.status === 401) {
        // Token is invalid or expired, redirect to login
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  post: async (url: string, body: any) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  put: async (url: string, body: any) => {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  delete: async (url: string) => {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    });
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    // DELETE might not return a body, so we don't call .json()
    return response;
  },
};

export default api;
