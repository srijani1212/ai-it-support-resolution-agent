export type PasswordStatus = "active" | "expired" | "locked";
export type PrintSpoolerStatus = "online" | "corrupted" | "offline";

export interface EnvironmentState {
  vpn_connected: boolean;
  certificate_valid: boolean;
  password_status: PasswordStatus;
  temp_password?: string;
  vpn_service_healthy: boolean;
  // Storage & Disk metrics
  disk_usage_percent: number;
  disk_free_gb: number;
  total_disk_gb: number;
  temp_files_gb: number;
  // Peripherals & Printer metrics
  print_spooler_status: PrintSpoolerStatus;
  pending_print_jobs: number;
  last_action: string;
}

export type EventType =
  | "ticket_received"
  | "rag_retrieved"
  | "tool_selected"
  | "tool_result"
  | "verification"
  | "escalation"
  | "resolved";

export interface AgentActivityEvent {
  step: number;
  event_type: EventType;
  description: string;
  details?: Record<string, any>;
}

export interface AgentResponse {
  status: "PENDING_LOGIN" | "RESOLVED" | "ESCALATE";
  resolution: string | null;
  new_password?: string;
  actions_taken: string[];
  reason: string | null;
  tool_results: any[];
  knowledge: string[];
  events: AgentActivityEvent[];
  environment_state?: EnvironmentState | null;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  password_status: string;
}

export interface VpnTestResponse {
  status: "connected" | "disconnected";
  ip_address: string | null;
  gateway: string;
  tunnel_active: boolean;
}

export interface DiskTestResponse {
  status: "CRITICAL_FULL" | "HEALTHY" | "error";
  usage_percent: number;
  free_gb: number;
  total_gb: number;
  temp_cache_gb: number;
  details: string;
}

export interface PrinterTestResponse {
  status: "online" | "corrupted" | "offline" | "error";
  service_status?: string;
  queue_status?: string;
  printer?: string;
  printer_id?: string;
  model?: string;
  pending_jobs: number;
  details: string;
}

export interface ApprovalStep {
  level: number;
  role: string;
  approverName: string;
  department: string;
  status: "approved" | "pending" | "escalated" | "auto_waived" | "rejected";
  timestamp?: string;
  decisionNote?: string;
}

export interface TicketSLA {
  targetResolutionMinutes: number;
  targetResponseMinutes: number;
  resolutionTimeLabel: string;
  responseTimeLabel: string;
  status: "On-Track" | "Warning" | "Breached";
  remainingMinutes: number;
  elapsedMinutes: number;
  complianceRate: string;
  tier: string;
}

export interface DemoScenario {
  id: string;
  ticketId: string;
  ticket_id?: string;
  title: string;
  category: "password" | "vpn" | "disk" | "printer" | "network" | "mfa" | "outage" | "general" | string;
  priority: "High" | "Medium" | "Urgent" | "Low" | string;
  reporter: string;
  ticket: string;
  ticket_text?: string;
  created_at?: string;
  description: string;
  initialEnv: Partial<EnvironmentState>;
  sla: TicketSLA;
  approvalHierarchy: ApprovalStep[];
  requiresApproval?: boolean;
}

