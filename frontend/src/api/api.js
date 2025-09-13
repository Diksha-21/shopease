import { getToken } from "./token.js";

const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://shopease.com/api"
    : "http://localhost:5000/api");

export const getImageUrl = (imagePath) => {
  if (!imagePath || typeof imagePath !== "string") return "";
  if (imagePath.startsWith("http")) return imagePath;

  const cleanedPath = imagePath.replace(/^\/?api\//, "").replace(/^\/+/, "");
  const base =
    import.meta.env.VITE_API_BASE_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://shopease.com"
      : "http://localhost:5000");

  return `${base}/${cleanedPath}`;
};

export const getItemImage = (item) => {
  const images = item?.images;
  if (!images || !Array.isArray(images) || images.length === 0) {
    return "/placeholder-product.jpg";
  }
  return getImageUrl(images[0]);
};


const coreFetch = async (endpoint, options = {}) => {
  const token = getToken();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(!(options.body instanceof FormData) &&
      !("Content-Type" in (options.headers || {}))
      ? { "Content-Type": "application/json" }
      : {}),
    "X-Request-Type": "API-Request",
  };

  if (options.body !== undefined) {
    if (
      !(options.body instanceof FormData) &&
      typeof options.body !== "string"
    ) {
      options.body = JSON.stringify(options.body);
    }
  }

  try {
    const url = `${baseURL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
      credentials: "include",
    });

    clearTimeout(timeoutId);

    const contentType = res.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await res.json() : {};

    if (!res.ok) throw new Error(data.message || `API Error (${res.status})`);

    return data;
  } catch (err) {
    console.error("Network/API Request Error:", err.message);
    throw err;
  }
};

export const apiRequest = {
  get: (endpoint) => coreFetch(endpoint, { method: "GET" }),
  post: (endpoint, body) => coreFetch(endpoint, { method: "POST", body }),
  put: (endpoint, body) => coreFetch(endpoint, { method: "PUT", body }),
  delete: (endpoint) => coreFetch(endpoint, { method: "DELETE" }),
  raw: coreFetch,
};
