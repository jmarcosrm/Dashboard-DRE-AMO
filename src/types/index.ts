// Core Types for Financial Dashboard Enterprise

// Entity Types
export interface Entity {
  id: string;
  name: string;
  code: string;
  cnpj: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Account Types
export type AccountNature = 'revenue' | 'deduction' | 'cost' | 'expense' | 'other_revenue' | 'other_expense';

export interface Account {
  id: string;
  name: string;
  code: string;
  level: number;
  nature: AccountNature;
  parentId?: string | null;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  children?: Account[];
}

// Financial Fact Types
export type ScenarioType = 'real' | 'budget' | 'forecast';

export interface Scenario {
  id: ScenarioType;
  name: string;
  description: string;
}

export interface FinancialFact {
  id: string;
  entityId: string;
  accountId: string;
  scenarioId: ScenarioType;
  year: number;
  month: number;
  value: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// User Types
export type UserRole = 'analyst' | 'manager' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  language: 'pt-BR' | 'en-US';
  currency: string;
  numberFormat: 'compact' | 'full';
  notifications: {
    email: boolean;
    push: boolean;
    alerts: boolean;
  };
}

// Filter Types
export interface DashboardFilters {
  entityIds: string[];
  scenarios: ScenarioType[];
  periodStart: string;
  periodEnd: string;
  accountIds?: string[];
}

// KPI Types
export interface KPIData {
  id: string;
  title: string;
  value: number;
  previousValue?: number;
  target?: number;
  format: 'currency' | 'percentage' | 'number';
  trend: 'up' | 'down' | 'stable';
  sparklineData?: number[];
  icon?: string;
  color?: string;
}

// Chart Data Types
export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
  category?: string;
}

export interface WaterfallDataPoint {
  name: string;
  value: number;
  cumulative: number;
  type: 'positive' | 'negative' | 'total';
}

export interface TimeSeriesDataPoint {
  period: string;
  value: number;
  scenario?: ScenarioType;
  entity?: string;
}

// Comparison Types
export interface ComparisonData {
  current: number;
  previous: number;
  variance: number;
  variancePercent: number;
  trend: 'up' | 'down' | 'stable';
}

// Report Types
export interface ReportConfig {
  id: string;
  name: string;
  description?: string;
  filters: DashboardFilters;
  charts: string[];
  format: 'pdf' | 'excel' | 'csv';
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    time: string;
    recipients: string[];
  };
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  count?: number;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
}

// Store State Types
export interface DashboardState {
  filters: DashboardFilters;
  entities: Entity[];
  accounts: Account[];
  financialFacts: FinancialFact[];
  kpis: KPIData[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

export interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  modals: Record<string, boolean>;
  loading: Record<string, boolean>;
  globalLoading: boolean;
  notifications: Notification[];
  activeView: string;
  viewConfig: Record<string, any>;
  screenSize: 'mobile' | 'tablet' | 'desktop' | '4k';
  isMobile: boolean;
  preferences: {
    compactMode: boolean;
    showAnimations: boolean;
    autoRefresh: boolean;
    refreshInterval: number;
    defaultChartType: 'area' | 'bar' | 'line';
    showTooltips: boolean;
    highContrast: boolean;
    reducedMotion: boolean;
  };
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actions?: {
    label: string;
    action: () => void;
  }[];
}

// Form Types
export interface EntityFormData {
  name: string;
  code: string;
  cnpj: string;
  isActive: boolean;
}

export interface AccountFormData {
  name: string;
  code: string;
  level: number;
  nature: AccountNature;
  parentId?: string | null;
  isActive: boolean;
}

export interface FinancialFactFormData {
  entityId: string;
  accountId: string;
  scenarioId: ScenarioType;
  year: number;
  month: number;
  value: number;
  currency?: string;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// All types are already exported above with their definitions