import axios from "axios";
import type {
  ChatRequest,
  ChatResponse,
  UploadResponse,
  HistoryResponse,
  Conversation,
} from "../types/api";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

export async function sendChat(payload: ChatRequest): Promise<ChatResponse> {
  const { data } = await api.post<ChatResponse>("/chat", payload);
  return data;
}

export async function uploadReport(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<UploadResponse>("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function getHistory(): Promise<HistoryResponse> {
  const { data } = await api.get<HistoryResponse>("/history");
  return data;
}

export async function getConversation(id: string): Promise<Conversation> {
  const { data } = await api.get<Conversation>(`/history/${id}`);
  return data;
}

export async function checkHealth(): Promise<{ status: string; service: string; env: string }> {
  const { data } = await api.get("/health");
  return data;
}

export function friendlyErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.detail) {
      return typeof error.response.data.detail === "string"
        ? error.response.data.detail
        : "The server rejected this request. Check the details and try again.";
    }
    if (error.code === "ERR_NETWORK") {
      return "Can't reach the HealthMate backend. Make sure it's running at " + BASE_URL + ".";
    }
  }
  return "Something went wrong. Please try again.";
}
