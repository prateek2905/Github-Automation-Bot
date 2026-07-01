import axios from "axios";

export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function authHeader() {
  return { Authorization: "Bearer " + localStorage.getItem("token") };
}

export const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = "Bearer " + token;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 403) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);
