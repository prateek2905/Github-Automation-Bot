import axios from "axios";

export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function authHeader() {
  return { Authorization: "Bearer " + localStorage.getItem("token") };
}

export const api = axios.create({ baseURL: BASE_URL });
