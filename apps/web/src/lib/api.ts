import { getToken } from "./auth-storage";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:3001";

export type Tenant = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  currency: string;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
  tenant: { id: string; slug: string; name: string };
};

export type Client = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  notes?: string | null;
  _count?: { orders: number; measurements: number };
};

export type MeasurementProfile = {
  id: string;
  label: string;
  data: Record<string, number | string>;
  createdAt: string;
  updatedAt: string;
};

export type ClientDetail = Client & {
  measurements: MeasurementProfile[];
};

export type CreateClientInput = {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  notes?: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  garmentType: string;
  fabric: string | null;
  status: string;
  createdAt: string;
  dueDate: string | null;
  collectionDate: string | null;
  client: { id?: string; firstName: string; lastName: string };
};

export type CreateOrderInput = {
  clientId: string;
  garmentType: string;
  fabric?: string;
  styleNotes?: string;
  price?: number;
  deposit?: number;
  orderDate?: string;
  dueDate?: string;
  collectionDate?: string;
};

export type OrderStatus =
  | "NEW"
  | "IN_PROGRESS"
  | "FITTING"
  | "READY"
  | "DELIVERED"
  | "CANCELLED";

export type AssistantResponse = {
  answer: string;
  intent: string;
  data: unknown;
  engine: "rules" | "openai+tools";
};

export type FitGraph = {
  orderId: string;
  orderNumber: string;
  garmentType: string;
  status: string;
  clientName: string;
  baseline: {
    label: string;
    data: Record<string, number | string>;
    createdAt: string;
    source: "client_profile" | "order_linked";
    submittedVia: "STUDIO" | "PORTAL";
  } | null;
  fittingRounds: Array<{
    id: string;
    roundNumber: number;
    label: string;
    measurements: Record<string, number | string>;
    alterations: string | null;
    notes: string | null;
    createdAt: string;
    deltasFromPrevious: Array<{
      field: string;
      from: number | null;
      to: number;
      deltaCm: number | null;
    }>;
    alerts: Array<{
      field: string;
      severity: "watch" | "warning";
      message: string;
    }>;
  }>;
  outcome: {
    fitSuccess: boolean;
    remakeRequired: boolean;
    notes: string | null;
    recordedAt: string;
  } | null;
  fitConfidence: number;
  totalAlerts: number;
};

export type FitSummary = {
  orderId: string;
  fitConfidence: number;
  totalAlerts: number;
  fittingRoundCount: number;
  hasBaseline: boolean;
  hasOutcome: boolean;
  outcomeSuccess: boolean | null;
};

export type PortalPayload = {
  tenant: Tenant;
  orders: Order[];
};

export type PortalLookupOrder = {
  id: string;
  orderNumber: string;
  garmentType: string;
  fabric: string | null;
  status: string;
  createdAt: string;
  dueDate: string | null;
  collectionDate: string | null;
  hasMeasurements: boolean;
  canSubmitMeasurements: boolean;
};

export type PortalLookupResponse = {
  tenant: { name: string; slug: string };
  client: { firstName: string; lastName: string };
  orders: PortalLookupOrder[];
};

export type PortalInviteResponse = {
  clientId: string;
  clientName: string;
  email: string | null;
  expiresAt: string;
  inviteUrl: string;
  token: string;
};

export type StudioInsights = {
  activeOrders: number;
  atFitRisk: number;
  averageProcessingDays: number | null;
  deliveredGoodFitPercent: number | null;
  deliveredWithOutcomeCount: number;
  ordersByStatus: Array<{ status: string; label: string; count: number }>;
};

async function apiFetch<T>(
  path: string,
  options: RequestInit & { tenantSlug?: string; auth?: boolean } = {},
): Promise<T> {
  const { tenantSlug, auth = false, headers, ...rest } = options;

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(tenantSlug ? { "X-Tenant-Slug": tenantSlug } : {}),
  };

  if (auth) {
    const token = getToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      ...requestHeaders,
      ...headers,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      error?: string;
      message?: string;
    };
    throw new Error(body.error ?? body.message ?? `API error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const vynedresApi = {
  getTenant: (slug: string) => apiFetch<Tenant>(`/api/v1/tenants/${slug}`),

  login: (tenantSlug: string, email: string, password: string) =>
    apiFetch<LoginResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ tenantSlug, email, password }),
    }),

  me: () => apiFetch<{ user: AuthUser; tenant: Tenant | null }>("/api/v1/auth/me", { auth: true }),

  /** Public client portal — invite token required for session + measurements. */
  getPortal: (slug: string) => apiFetch<PortalPayload>(`/api/v1/portal/${slug}/orders`),

  portalSession: (slug: string, token: string) =>
    apiFetch<PortalLookupResponse>(`/api/v1/portal/${slug}/session`, {
      method: "POST",
      body: JSON.stringify({ token }),
    }),

  portalSubmitMeasurements: (
    slug: string,
    data: {
      token: string;
      orderId?: string;
      label?: string;
      data: Record<string, number | string>;
    },
  ) =>
    apiFetch<{ message: string; profile: { id: string; label: string; createdAt: string } }>(
      `/api/v1/portal/${slug}/measurements`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    ),

  getClients: (tenantSlug: string) =>
    apiFetch<Client[]>("/api/v1/clients", { tenantSlug, auth: true }),

  getClient: (tenantSlug: string, clientId: string) =>
    apiFetch<ClientDetail>(`/api/v1/clients/${clientId}`, { tenantSlug, auth: true }),

  createPortalInvite: (tenantSlug: string, clientId: string) =>
    apiFetch<PortalInviteResponse>(`/api/v1/clients/${clientId}/portal-invite`, {
      method: "POST",
      tenantSlug,
      auth: true,
      body: JSON.stringify({}),
    }),

  createMeasurement: (
    tenantSlug: string,
    clientId: string,
    data: { label: string; data: Record<string, number | string> },
  ) =>
    apiFetch<MeasurementProfile>(`/api/v1/clients/${clientId}/measurements`, {
      method: "POST",
      tenantSlug,
      auth: true,
      body: JSON.stringify(data),
    }),

  getOrders: (tenantSlug: string) =>
    apiFetch<Order[]>("/api/v1/orders", { tenantSlug, auth: true }),

  getFitSummaries: (tenantSlug: string) =>
    apiFetch<FitSummary[]>("/api/v1/orders/fit-summaries", { tenantSlug, auth: true }),

  getStudioInsights: (tenantSlug: string) =>
    apiFetch<StudioInsights>("/api/v1/orders/studio-insights", { tenantSlug, auth: true }),

  createClient: (tenantSlug: string, data: CreateClientInput) =>
    apiFetch<Client>("/api/v1/clients", {
      method: "POST",
      tenantSlug,
      auth: true,
      body: JSON.stringify(data),
    }),

  createOrder: (tenantSlug: string, data: CreateOrderInput) =>
    apiFetch<Order>("/api/v1/orders", {
      method: "POST",
      tenantSlug,
      auth: true,
      body: JSON.stringify(data),
    }),

  updateOrderStatus: (
    tenantSlug: string,
    orderId: string,
    status: OrderStatus,
    note?: string,
  ) =>
    apiFetch<Order>(`/api/v1/orders/${orderId}/status`, {
      method: "PATCH",
      tenantSlug,
      auth: true,
      body: JSON.stringify({ status, ...(note ? { note } : {}) }),
    }),

  updateOrder: (
    tenantSlug: string,
    orderId: string,
    data: {
      orderDate?: string;
      collectionDate?: string | null;
      dueDate?: string | null;
    },
  ) =>
    apiFetch<Order>(`/api/v1/orders/${orderId}`, {
      method: "PATCH",
      tenantSlug,
      auth: true,
      body: JSON.stringify(data),
    }),

  askAssistant: (tenantSlug: string, question: string) =>
    apiFetch<AssistantResponse>("/api/v1/assistant/chat", {
      method: "POST",
      tenantSlug,
      auth: true,
      body: JSON.stringify({ question }),
    }),

  getFitGraph: (tenantSlug: string, orderId: string) =>
    apiFetch<FitGraph>(`/api/v1/orders/${orderId}/fit-graph`, {
      tenantSlug,
      auth: true,
    }),

  addFittingRound: (
    tenantSlug: string,
    orderId: string,
    data: {
      label?: string;
      measurements: Record<string, number | string>;
      alterations?: string;
      notes?: string;
    },
  ) =>
    apiFetch<{ round: unknown; graph: FitGraph }>(
      `/api/v1/orders/${orderId}/fitting-rounds`,
      {
        method: "POST",
        tenantSlug,
        auth: true,
        body: JSON.stringify(data),
      },
    ),

  recordOrderOutcome: (
    tenantSlug: string,
    orderId: string,
    data: { fitSuccess: boolean; remakeRequired?: boolean; notes?: string },
  ) =>
    apiFetch<{ outcome: unknown; graph: FitGraph }>(
      `/api/v1/orders/${orderId}/outcome`,
      {
        method: "PUT",
        tenantSlug,
        auth: true,
        body: JSON.stringify(data),
      },
    ),
};

/** Browser-side API helpers (same endpoints, for client components). */
export const vynedresClientApi = vynedresApi;
