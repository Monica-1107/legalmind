// API utility for backend integration

export async function uploadDocument(file: File, token: string) {
  const formData = new FormData();
  formData.append('file', file);
  // Retrieve token from localStorage
  if (!token) throw new Error('No authentication token found. Please log in.');
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function analyzeDocument(docId: string, data: { analysis_mode: string; content?: string; analysis_level?: number },token:string) {
  //const token = localStorage.getItem('token');
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/documents/${docId}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function chatWithDocument(payload: { message: string; document_id: string; session_id?: string; hypothetical?: boolean; mode?: string }, token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
