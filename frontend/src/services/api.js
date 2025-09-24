import axios from "axios";

const API_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
});

// Transaction API calls
export const transactionAPI = {
  getAll: () => api.get("/transactions"),
  getById: (id) => api.get(`/transactions/${id}`),
  create: (data) =>
    api.post("/transactions", data, {
      headers: { "Content-Type": "application/json" },
    }),
  update: (id, data) =>
    api.put(`/transactions/${id}`, data, {
      headers: { "Content-Type": "application/json" },
    }),
  delete: (id) => api.delete(`/transactions/${id}`),
  createBatch: (data) =>
    api.post(
      "/transactions/batch",
      { transactions: data },
      {
        headers: { "Content-Type": "application/json" },
      }
    ),
};

// User API calls
export const userAPI = {
  register: (data) =>
    api.post("/users", data, {
      headers: { "Content-Type": "application/json" },
    }),
  login: (data) =>
    api.post("/users/login", data, {
      headers: { "Content-Type": "application/json" },
    }),
  getProfile: () => api.get("/users/profile"),
};

// File upload API call
export const uploadAPI = {
  parseFiles: (files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    return api.post("/parse", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export default api;