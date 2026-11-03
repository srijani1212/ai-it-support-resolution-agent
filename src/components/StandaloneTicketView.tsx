import React, { useState, useEffect } from "react";
import {
  Bot,
  ArrowLeft,
  KeyRound,
  ShieldAlert,
  Lock,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { InteractiveSimulator } from "./InteractiveSimulator";
import { ResolutionSummary } from "./ResolutionSummary";
import { AgentStepsTimeline } from "./AgentStepsTimeline";
import {
  DemoScenario,
  EnvironmentState,
  AgentResponse,
  ApprovalStep,
  LoginResponse,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

interface StandaloneTicketViewProps {
  scenario: DemoScenario;
  onBack?: () => void;
}

export const StandaloneTicketView: React.FC<StandaloneTicketViewProps> = ({
  scenario,
  onBack,
}) => {
  const [environment, setEnvironment] = useState<EnvironmentState>({
    vpn_connected: scenario.initialEnv.vpn_connected ?? false,
    certificate_valid: scenario.initialEnv.certificate_valid ?? true,
    password_status: scenario.initialEnv.password_status ?? "active",
    vpn_service_healthy: scenario.initialEnv.vpn_service_healthy ?? true,
    disk_usage_percent: scenario.initialEnv.disk_usage_percent ?? 38,
    disk_free_gb: scenario.initialEnv.disk_free_gb ?? 310,
    total_disk_gb: scenario.initialEnv.total_disk_gb ?? 500,
    temp_files_gb: scenario.initialEnv.temp_files_gb ?? 0,
    print_spooler_status:
      scenario.initialEnv.print_spooler_status ?? "online",
    pending_print_jobs: scenario.initialEnv.pending_print_jobs ?? 0,
    last_action: "Initial ticket state loaded.",
  });

  const [agentResponse, setAgentResponse] =
    useState<AgentResponse | null>(null);

  const [loading, setLoading] = useState(false);

  const [approvalSteps, setApprovalSteps] = useState<ApprovalStep[]>(
    scenario.approvalHierarchy
  );

  // Reset the ticket and mock environment.
  const resetTicketState = async () => {
    setAgentResponse(null);
    setApprovalSteps(scenario.approvalHierarchy);

    try {
      const res = await fetch(`${API_BASE_URL}/api/environment/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scenario.initialEnv),
      });

      if (res.ok) {
        const data = await res.json();
        setEnvironment(data);
      }
    } catch (err) {
      console.error("Failed to reset ticket state:", err);
    }
  };

  useEffect(() => {
    resetTicketState();
  }, [scenario.id]);

  // Run AI Agent Resolution.
  const handleRunAgent = async (ticketText: string) => {
    setAgentResponse(null);
    setLoading(true);

    try {
        const res = await fetch(`${API_BASE_URL}/api/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket: ticketText }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to execute agent`);
      }

      const data: AgentResponse = await res.json();

      setAgentResponse(data);

      if (data.environment_state) {
        setEnvironment(data.environment_state);
      }
    } catch (err: any) {
      console.error("Ticket resolution error:", err);

      setAgentResponse({
        status: "ESCALATE",
        resolution: null,
        actions_taken: [],
        reason:
          err.message ||
          "Failed to reach AI support resolution service.",
        tool_results: [],
        knowledge: [],
        events: [
          {
            step: 1,
            event_type: "escalation",
            description: `Agent execution failed: ${err.message}. Escalating to human IT administrator.`,
          },
        ],
        environment_state: environment,
      });
    } finally {
      setLoading(false);
    }
  };

  // Called by the existing login portal after successful authentication.
  const handleEmployeeLoginSuccess = (result: LoginResponse) => {
    if (!result.success) {
      return;
    }

    setAgentResponse((prev) => {
      // Only resolve tickets waiting for employee login.
      if (!prev || prev.status !== "PENDING_LOGIN") {
        return prev;
      }

      return {
        ...prev,
        status: "RESOLVED",
        resolution:
          "Employee successfully authenticated using the temporary password. Account access verified.",
        reason: null,

        // Keep the successful login in the execution history.
        tool_results: [
          ...(prev.tool_results || []),
          {
            tool: "mock_login",
            success: true,
            message: result.message,
          },
        ],

        events: [
          ...(prev.events || []),
          {
            step: (prev.events || []).length + 1,
            event_type: "verification",
            description:
              "Employee entered the temporary password in the existing login portal and login was successfully verified.",
            details: {
              verified: true,
            },
          },
        ],

        environment_state: {
          ...(prev.environment_state || environment),
          password_status: "active",
          last_action: "Employee login successfully verified.",
        },
      };
    });

    setEnvironment((prev) => ({
      ...prev,
      password_status: "active",
      last_action: "Employee login successfully verified.",
    }));
  };

  // Human Manager signs off in HITL Approval Chain.
  const handleHumanApprove = (
    level: number,
    note: string,
    updatedSteps: ApprovalStep[]
  ) => {
    setApprovalSteps(updatedSteps);

    const stepObj = scenario.approvalHierarchy.find(
      (s) => s.level === level
    );

    const approverRole = stepObj?.role || `Level ${level} Approver`;
    const approverName = stepObj?.approverName || "Manager";

    const pendingSteps = updatedSteps.filter(
      (s) => s.status === "pending" || s.status === "escalated"
    );

    const isFullyApproved = pendingSteps.length === 0;
    const nextPending = pendingSteps[0];

    setAgentResponse((prev) => {
      const existingEvents = prev?.events || [];

      const newEvent = {
        step: existingEvents.length + 1,
        event_type: "verification" as const,
        description: `HITL Sign-off (Level ${level}): Signed by ${approverName} (${approverRole}). Decision Note: "${note}"`,
      };

      const cleanedActions = (prev?.actions_taken || []).filter(
        (a) =>
          !a.startsWith("manager_signoff") &&
          !a.startsWith("human_")
      );

      if (isFullyApproved) {
        return {
          status: "RESOLVED",
          resolution: `All approval tiers completed and authorized. Final Level 3 governance sign-off granted by ${approverName} (${approverRole}): "${note}"`,
          actions_taken: cleanedActions,
          reason: "",
          tool_results: prev?.tool_results || [],
          knowledge: prev?.knowledge || [
            "SOP-ITSM-004: Managerial Approval and Multi-tier Authorization Sign-off",
          ],
          events: [...existingEvents, newEvent],
          environment_state: environment,
          humanApproved: true,
          allApprovalTiersCompleted: true,
        } as any;
      }

      return {
        status: "ESCALATE",
        resolution: null,
        actions_taken: cleanedActions,
        reason: `Level ${level} approval granted by ${approverName}. Awaiting Level ${nextPending?.level || 3} (${nextPending?.role || "L3 Governance"}) approval before this request can be marked resolved.`,
        tool_results: prev?.tool_results || [],
        knowledge: prev?.knowledge || [
          "SOP-ITSM-004: Managerial Approval and Multi-tier Authorization Sign-off",
        ],
        events: [...existingEvents, newEvent],
        environment_state: environment,
        humanApproved: false,
        pendingApprovalLevel: nextPending?.level || 3,
        pendingApproverRole:
          nextPending?.role || "Level 3 Security/Architecture",
      } as any;
    });
  };

  const getPriorityColor = (priority: DemoScenario["priority"]) => {
    switch (priority) {
      case "Urgent":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "High":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Standalone Ticket Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                title="Return to Ticket Queue Dashboard"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>← All Tickets</span>
              </button>
            ) : (
              <a
                href="/"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                title="Return to Ticket Queue Dashboard"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>← All Tickets</span>
              </a>
            )}

            <div className="h-5 w-px bg-slate-200" />

            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {scenario.ticketId}
                </span>

                <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate max-w-[200px] sm:max-w-md">
                  {scenario.title}
                </h1>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border hidden sm:inline-block ${getPriorityColor(
                    scenario.priority
                  )}`}
                >
                  {scenario.priority}
                </span>
              </div>

              <p className="text-[11px] text-slate-500 truncate">
                Reporter: {scenario.reporter} • Category:{" "}
                {scenario.category.toUpperCase()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 cursor-pointer"
              >
                <span>Queue</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Single Ticket Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        <InteractiveSimulator
          scenario={scenario}
          environment={environment}
          onRunAgent={handleRunAgent}
          loading={loading}
          agentResponse={agentResponse}
          onResetIssue={resetTicketState}
          onEmployeeLoginSuccess={handleEmployeeLoginSuccess}
          onHumanApprove={handleHumanApprove}
          approvalSteps={approvalSteps}
        />

        {/* AI Resolution Summary */}
        <ResolutionSummary
          response={agentResponse}
          loading={loading}
          scenario={scenario}
        />

        {/* Observable Execution Timeline */}
        {agentResponse && (
          <AgentStepsTimeline events={agentResponse.events || []} />
        )}
      </main>
    </div>
  );
};