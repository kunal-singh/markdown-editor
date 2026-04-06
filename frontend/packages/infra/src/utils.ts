export async function handleResponse(res: Response): Promise<unknown> {
  if (!res.ok) {
    const body = await res.text();
    let message: string;
    try {
      message = (JSON.parse(body) as { detail?: string }).detail ?? body;
    } catch {
      message = body || `HTTP ${String(res.status)}`;
    }
    throw new Error(message);
  }
  return res.json();
}
