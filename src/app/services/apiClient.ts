type ApiUser = {
    id: string;
    username: string;
  email?: string | null;
    avatarUrl?: string | null;
    name: string;
    role: string;
    filialId?: string | null;
  };
  
  type ApiLoginResponse = {
    token: string;
    user: ApiUser;
  };
  
  type SyncDataResponse = {
    alunos: any[];
    receitas: any[];
    despesas: any[];
    filiais: any[];
  };
  
  const getApiBaseUrl = () => {
    return (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000';
  };
  
  async function apiFetch<T>(path: string, options: RequestInit): Promise<T> {
    const url = `${getApiBaseUrl()}${path}`;
    const res = await fetch(url, options);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(text || `Erro HTTP ${res.status}`);
    }
    return (await res.json()) as T;
  }
  
  export async function loginApi(username: string, password: string): Promise<ApiLoginResponse> {
    return apiFetch<ApiLoginResponse>('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
  }

  export async function registerApi(payload: {
    name: string;
    username: string;
    email: string;
    password: string;
  }): Promise<ApiLoginResponse> {
    return apiFetch<ApiLoginResponse>('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  export async function registerGoogleApi(payload: {
    name: string;
    email: string;
  }): Promise<ApiLoginResponse> {
    return apiFetch<ApiLoginResponse>('/api/auth/register-google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }
  
  export async function syncApi(token: string): Promise<SyncDataResponse> {
    return apiFetch<SyncDataResponse>('/api/data/sync', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  }
  
  export async function patchDespesaApi(
    token: string,
    despesaId: string,
    payload: { status: string; dataPagamento?: string | null },
  ): Promise<any> {
    return apiFetch<any>(`/api/despesas/${despesaId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  }

  export async function changePasswordApi(
    token: string,
    payload: { currentPassword: string; newPassword: string },
  ): Promise<{ message: string }> {
    return apiFetch<{ message: string }>('/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  }

  export async function forgotPasswordApi(
    payload: { email: string },
  ): Promise<{ message: string }> {
    return apiFetch<{ message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  export async function updateProfileApi(
    token: string,
    payload: { name: string; email: string; avatarUrl?: string | null },
  ): Promise<{ user: ApiUser }> {
    return apiFetch<{ user: ApiUser }>('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  }
  
  