const endpoint = '/api/habits';
async function request(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } });
  if (!response.ok) {
    let message = 'Something went wrong. Please try again.';
    try { message = (await response.json()).error || message; } catch { /* Keep the friendly fallback for non-JSON errors. */ }
    throw new Error(message);
  }
  return response.status === 204 ? null : response.json();
}
export const api = {
  list: () => request(endpoint),
  create: data => request(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`${endpoint}/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: id => request(`${endpoint}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  toggle: (id, date) => request(`${endpoint}/${encodeURIComponent(id)}/toggle`, { method: 'PATCH', body: JSON.stringify({ date }) })
};
