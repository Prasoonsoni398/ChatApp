const BASE = '/api/status';

const getToken = () => localStorage.getItem('token');
const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

export const uploadStatus = async (formData) => {
    const res = await fetch(BASE, {
        method: 'POST',
        headers: authHeader(),
        body: formData, // fetch will automatically set the correct multipart/form-data headers
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to upload status');
    return data;
};

export const getStatuses = async () => {
    const res = await fetch(BASE, {
        method: 'GET',
        headers: authHeader(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch statuses');
    return data;
};

export const deleteStatus = async (id) => {
    const res = await fetch(`${BASE}/${id}`, {
        method: 'DELETE',
        headers: authHeader(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete status');
    return data;
};
