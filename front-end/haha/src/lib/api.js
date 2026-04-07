import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL ?? "";

// ── Axios instance với auto Bearer token ─────────────────────────────────────
const axiosClient = axios.create({ baseURL: API_URL, withCredentials: true });

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auto refresh token khi nhận 401 ──────────────────────────────────────────
let isRefreshing = false;
let pendingQueue = [];

const flushQueue = (error, token = null) => {
  pendingQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  );
  pendingQueue = [];
};

axiosClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return axiosClient(original);
      });
    }
    original._retry = true;
    isRefreshing = true;
    try {
      const { data } = await axios.post(
        `${API_URL}/api/auth/refresh-token`,
        {},
        { withCredentials: true }
      );
      const newToken = data.token;
      localStorage.setItem("token", newToken);
      flushQueue(null, newToken);
      original.headers.Authorization = `Bearer ${newToken}`;
      return axiosClient(original);
    } catch (err) {
      flushQueue(err);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.dispatchEvent(new Event("userUpdated"));
      window.location.replace("/login");
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosClient;

// ── fetchAPI (giữ backward-compat cho code dùng fetch) ───────────────────────
export async function fetchAPI(path) {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json.data;
}
