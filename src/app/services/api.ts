import { formatBanglaShortDate } from "../utils/date";

const RAW_API_BASE = import.meta.env.PROD
  ? "/api"
  : import.meta.env.VITE_API_URL ?? "/api";

function buildUrl(path: string) {
  const base = (RAW_API_BASE || "").replace(/\/$/, "");

  // If base is empty or just '/', use relative '/api' prefix
  if (!base || base === "/") {
    return path.startsWith("/api") ? path : `/api${path}`;
  }

  // If base is an absolute URL
  if (base.startsWith("http://") || base.startsWith("https://")) {
    if (base.endsWith("/api")) {
      return `${base}${path}`;
    }
    return `${base}${path.startsWith("/api") ? path : `/api${path}`}`.replace(/([^:]\/)\/+/, "$1");
  }

  // Otherwise treat base as a relative prefix (e.g. '/api')
  return `${base}${path}`;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getToken(role: "user" | "admin" = "user"): string | null {
  if (role === "admin") {
    return localStorage.getItem("adminToken");
  }
  // Only use the user token for user-scoped requests. Do NOT fall back to admin token.
  // Falling back caused admin token to be used for normal user actions when a user
  // wasn't logged-in, exposing other users' data.
  return localStorage.getItem("userToken");
}

async function request<T>(
  path: string,
  options?: RequestInit,
  role?: "user" | "admin" | "none",
): Promise<T>;
async function request<T>(
  path: string,
  options: RequestInit,
  role: "user" | "admin" | "none",
  includeMessage: true,
): Promise<{ data: T; message: string }>;
async function request<T>(
  path: string,
  options: RequestInit = {},
  role: "user" | "admin" | "none" = "user",
  includeMessage = false,
): Promise<T | { data: T; message: string }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (role !== "none") {
    const token = getToken(role);
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    const url = buildUrl(path);
    response = await fetch(url, {
      cache: "no-store",
      ...options,
      headers,
    });
  } catch (err: any) {
    if (err?.name === "TypeError" || err?.message?.includes("fetch")) {
      throw new Error("সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি (Backend server is offline or unreachable)।");
    }
    throw err;
  }

  // Handle 401 — don't clear tokens here, let each page handle auth failures
  if (response.status === 401) {
    throw new ApiError("Unauthorized", response.status);
  }

  // Safely parse JSON — avoids "Unexpected end of JSON input" on empty/HTML responses
  let body: (ApiResponse<T> & { message?: string }) | null = null;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const text = await response.text();
    try {
      body = JSON.parse(text) as ApiResponse<T> & { message?: string };
    } catch {
      throw new Error(`Invalid JSON response from server (${response.status})`);
    }
  }

  if (!response.ok || !body?.success) {
    if (body?.message) {
      throw new ApiError(body.message, response.status);
    }
    if (response.status === 500) {
      throw new ApiError("সার্ভারে সমস্যা দেখা দিয়েছে (Error 500)। দয়া করে কিছুক্ষণ পর আবার চেষ্টা করুন।", response.status);
    }
    const method = (options.method ?? "GET").toUpperCase();
    throw new ApiError(
      `Request failed (${response.status}): ${method} ${RAW_API_BASE}${path}`,
      response.status,
    );
  }

  return includeMessage
    ? { data: body.data, message: body.message }
    : body.data;
}

export interface User {
  id: string;
  name: string;
  email?: string | null;
  phone: string;
  phoneNumber?: string;
  role: "USER" | "ADMIN";
  createdAt: string;
  assignedVouchers?: Array<{
    id: string;
    username: string;
    password: string;
    packageId: string;
    status: "AVAILABLE" | "USED";
    usedAt?: string | null;
    createdAt: string;
    package?: { id: string; name: string; type: string };
  }>;
}

export interface AdminUser extends User {
  _count: { payments: number; assignedVouchers: number };
}

export interface Package {
  id: string;
  name: string;
  duration: number;
  price: number;
  type: "INTERNET" | "TV";
  createdAt: string;
}

export interface Voucher {
  id: string;
  username: string;
  password: string;
  packageId: string;
  status: "AVAILABLE" | "USED";
  assignedUserId?: string | null;
  usedAt?: string | null;
  createdAt: string;
  package?: { id: string; name: string; type: string };
  assignedUser?: { id: string; name: string; phone: string } | null;
}

export interface Payment {
  id: string;
  userId: string;
  packageId: string;
  amount: number;
  paymentMethod: string;
  transactionId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  voucherId?: string | null;
  createdAt: string;
  updatedAt: string;
  package?: Package;
  user?: { id: string; name: string; phone: string; email?: string | null };
  voucher?: {
    id: string;
    username: string;
    password: string;
    usedAt?: string | null;
  } | null;
}

function mapPaymentStatus(status: Payment["status"]) {
  if (status === "APPROVED") return "completed";
  if (status === "REJECTED") return "failed";
  return "pending";
}

export function toFrontendPayment(payment: Payment) {
  // Fallback: pull name/phone from localStorage if API didn't include user
  let fallbackName = "";
  let fallbackPhone = "";
  try {
    const userStr = localStorage.getItem("currentUser");
    if (userStr) {
      const u = JSON.parse(userStr);
      fallbackName = u.name || "";
      fallbackPhone = u.phoneNumber || u.phone || "";
    }
  } catch {}

  return {
    id: payment.id,
    packageName: payment.package?.name ?? "",
    amount: payment.amount,
    name: payment.user?.name || fallbackName,
    macAddress: "",
    phoneNumber: payment.user?.phone || fallbackPhone,
    transactionId: payment.transactionId,
    paymentMethod: payment.paymentMethod,
    date: formatBanglaShortDate(payment.createdAt, "—"),
    status: mapPaymentStatus(payment.status) as
      | "completed"
      | "pending"
      | "failed",
    createdAt: payment.createdAt,
    userId: payment.userId,
    voucherUsername: payment.voucher?.username,
    voucherPassword: payment.voucher?.password,
    wifiPassword: payment.voucher?.password,
    approvedAt: payment.voucher?.usedAt ?? undefined,
  };
}

export const api = {
  async register(name: string, phone: string, password: string, email?: string) {
    const data = await request<{ user: User; token: string }>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify({ name, phone, password, email }),
      },
      "none",
    );
    return { success: true as const, user: data.user, token: data.token };
  },

  async userLogin(phone: string, password: string) {
    const data = await request<{ user: User; token: string }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ phone, password }),
      },
      "none",
    );
    return {
      success: true as const,
      user: {
        id: data.user.id,
        name: data.user.name,
        phoneNumber: data.user.phone,
        email: data.user.email,
        role: data.user.role,
      },
      token: data.token,
    };
  },

  async adminLogin(phone: string, password: string) {
    const data = await request<{ user: User; token: string }>(
      "/admin/login",
      {
        method: "POST",
        body: JSON.stringify({ phone, password }),
      },
      "none",
    );
    return { success: true as const, token: data.token, user: data.user };
  },

  async me() {
    const data = await request<{ user: User }>('/auth/me', {}, 'none');
    const user = data.user;
    return {
      ...user,
      phoneNumber: user.phoneNumber ?? user.phone,
    };
  },

  async logout() {
    await request("/auth/logout", { method: "POST" }, "none");
    return { success: true as const };
  },

  async refreshToken() {
    const data = await request<{ user: User; token: string }>("/auth/refresh", { method: "POST" });
    if (data.token) {
      localStorage.setItem("userToken", data.token);
    }
    if (data.user) {
      localStorage.setItem("currentUser", JSON.stringify({
        id: data.user.id,
        name: data.user.name,
        phoneNumber: data.user.phone,
        email: data.user.email,
        role: data.user.role,
      }));
    }
    return { success: true as const, user: data.user, token: data.token };
  },

  async getPackages() {
    return request<Package[]>("/packages", {}, "none");
  },

  async createPayment(input: {
    packageId: string;
    paymentMethod: string;
    transactionId: string;
    name?: string;
    phoneNumber?: string;
  }) {
    const res = await request<any>("/payments/create", {
      method: "POST",
      body: JSON.stringify(input),
    });
    if (res.token) {
      localStorage.setItem("userToken", res.token);
    }
    if (res.user) {
      localStorage.setItem("currentUser", JSON.stringify(res.user));
    }
    return { success: true as const, payment: toFrontendPayment(res) };
  },

  async getUserPayments(_userId?: string) {
    const payments = await request<Payment[]>("/payments/my");
    return {
      payments: payments.map(toFrontendPayment),
    };
  },

  async getPayments() {
    const payments = await request<Payment[]>("/admin/payments", {}, "admin");
    return { payments: payments.map(toFrontendPayment) };
  },

  async approvePayment(id: string) {
    const result = await request<{
      payment: Payment;
      mikrotik: { username: string; password: string; profile: string };
    }>(
      `/admin/payments/${id}/approve`,
      { method: "PATCH" },
      "admin",
    );
    return {
      success: true as const,
      payment: toFrontendPayment(result.payment),
      voucher: result.mikrotik,
    };
  },

  async rejectPayment(id: string) {
    const payment = await request<Payment>(
      `/admin/payments/${id}/reject`,
      { method: "PATCH" },
      "admin",
    );
    return { success: true as const, payment: toFrontendPayment(payment) };
  },

  async getVouchers(status?: "AVAILABLE" | "USED", packageId?: string) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (packageId) params.set("packageId", packageId);
    const query = params.toString() ? `?${params.toString()}` : "";
    return request<Voucher[]>(`/vouchers${query}`, {}, "admin");
  },

  async uploadVoucher(input: {
    username: string;
    password: string;
    packageId: string;
  }) {
    return request<Voucher>(
      "/vouchers/upload",
      { method: "POST", body: JSON.stringify(input) },
      "admin",
    );
  },

  async bulkUploadVouchers(packageId: string, csv: string) {
    return request<{ created: number; total: number }>(
      "/vouchers/upload",
      {
        method: "POST",
        body: JSON.stringify({ packageId, csv }),
      },
      "admin",
    );
  },

  async deleteVoucher(id: string) {
    return request<{ deleted: boolean }>(
      `/vouchers/${id}`,
      { method: "DELETE" },
      "admin",
    );
  },

  async deleteAllVouchers() {
    return request<{ deleted: number }>(
      "/vouchers/all",
      { method: "DELETE" },
      "admin",
    );
  },

  async getVoucherStats() {
    return request<{ available: number; used: number }>(
      "/vouchers/stats",
      {},
      "admin",
    );
  },

  async getUsers() {
    return request<AdminUser[]>("/admin/users", {}, "admin");
  },

  async resetUserPassword(userId: string, newPassword: string) {
    return request<null>(
      `/admin/users/${encodeURIComponent(userId)}/reset-password`,
      {
        method: "PATCH",
        body: JSON.stringify({ newPassword }),
      },
      "admin",
      true,
    );
  },

  async deleteUser(id: string) {
    return request<{ id: string; name: string; phone: string }>(
      `/admin/users/${encodeURIComponent(id)}`,
      { method: "DELETE" },
      "admin",
    );
  },

  async checkUserExists(phoneNumber: string) {
    try {
      const result = await request<{ exists: boolean }>(
        "/auth/check-user",
        {
          method: "POST",
          body: JSON.stringify({ phone: phoneNumber }),
        },
        "none",
      );
      return result;
    } catch {
      return { exists: false };
    }
  },

  // Announcement support with backend
  async getAnnouncements() {
    const response = await request<unknown>("/announcements", {}, "none");
    if (Array.isArray(response)) {
      return { announcements: response };
    }
    if (
      response &&
      typeof response === "object" &&
      "announcements" in response &&
      Array.isArray(response.announcements)
    ) {
      return { announcements: response.announcements };
    }
    throw new Error("সার্ভার থেকে ঘোষণার তালিকা সঠিকভাবে পাওয়া যায়নি।");
  },
  async getAllAnnouncements() {
    return this.getAnnouncements();
  },
  async createAnnouncement(announcement: any) {
    return request<{ announcements: any[] }>("/announcements", {
      method: "POST",
      body: JSON.stringify(announcement),
    }, "admin");
  },
  async updateAnnouncement(id: string, updates: any) {
    return request<{ announcements: any[] }>(`/announcements/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    }, "admin");
  },
  async deleteAnnouncement(id: string) {
    return request<{ announcements: any[] }>(`/announcements/${id}`, {
      method: "DELETE",
    }, "admin");
  },
  async savePayment(_payment: unknown) {
    throw new Error("Use createPayment instead");
  },
  async updatePaymentStatus(id: string, status: string) {
    if (status === "completed") return api.approvePayment(id);
    if (status === "failed") return api.rejectPayment(id);
    throw new Error("Invalid status");
  },
  async userSignup(name: string, phoneNumber: string, password: string) {
    const data = await request<{ user: User; token: string }>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify({ name, phone: phoneNumber, password }),
      },
      "none",
    );
    return {
      success: true as const,
      user: {
        id: data.user.id,
        name: data.user.name,
        phoneNumber: data.user.phone,
      },
      token: data.token,
    };
  },
  async requestPasswordReset(phone: string) {
    return request<null>(
      "/auth/forgot-password",
      {
        method: "POST",
        body: JSON.stringify({ phone }),
      },
      "none",
    );
  },
  async verifyPasswordReset(phone: string, code: string, newPassword: string) {
    return request<null>(
      "/auth/verify-reset-otp",
      {
        method: "POST",
        body: JSON.stringify({ phone, code, newPassword }),
      },
      "none",
      true,
    );
  },
};
