import axios from 'axios';

interface ApiErrorBody {
  error?: string;
  message?: string;
}

export function getApiErrorMessage(error: unknown, fallback = 'Bağlantı hatası.'): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (error.response?.data?.error) return error.response.data.error;
    if (error.response?.data?.message) return error.response.data.message;
    if (error.code === 'ECONNABORTED') return 'İstek zaman aşımına uğradı.';
    return fallback;
  }

  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
