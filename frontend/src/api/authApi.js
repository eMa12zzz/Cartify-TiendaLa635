const API_URL = 'http://localhost:4000/api/authFlow';

export const loginStep1 = async (data) => {
  const response = await fetch(`${API_URL}/login-step-1`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Error en login');
  }
  return response.json();
};

export const loginStep2 = async (data) => {
  const response = await fetch(`${API_URL}/login-step-2`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Error al verificar');
  }
  return response.json();
};