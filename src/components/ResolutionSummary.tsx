
import React, { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  KeyRound,
  Copy,
  Check,
} from "lucide-react";

import { AgentResponse, DemoScenario } from "../types";

interface ResolutionSummaryProps {
  response: AgentResponse | null;
  loading: boolean;
  scenario: DemoScenario;
}

export const ResolutionSummary: React.FC<ResolutionSummaryProps> = ({
  response,
  loading,
  scenario,
}) => {
  const [copied, setCopied] = useState(false);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-indigo-200 p-6 shadow-xs flex flex-col items-center justify-center py-8 text-center space-y-3">
        <div className="w-9 h-9 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <div>
          <h3 className="font-semibold text-slate-800 text-xs sm:text-sm">
            AI Agent Working on Ticket...
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md">
            Checking troubleshooting steps, diagnosing the problem, and applying the fix...
          </p>
        </div>
      </div>
    );
  }

  if (!response) {
    return null;
  }

  const isResolved = response.status === "RESOLVED";
  const isPendingLogin = response.status === "PENDING_LOGIN";

  const isHumanApproved = (response as any).humanApproved === true;
  const pendingApprovalLevel = (response as any).pendingApprovalLevel;

  const agentTools = (response.actions_taken || []).filter(
    (action) =>
      !action.startsWith("manager_signoff") &&
      !action.startsWith("human_") &&
      !action.startsWith("hitl_")
  );

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className={`rounded-xl border p-5 sm:p-6 shadow-xs transition-all space-y-4 ${
        isResolved
          ? "bg-emerald-50/70 border-emerald-300"
          : isPendingLogin
          ? "bg-indigo-50/70 border-indigo-300"
          : "bg-amber-50/70 border-amber-300"
      }`}
    >
      {/* Outcome Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/70">
        <div className="flex items-center gap-2.5">
          {isResolved ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
          )}

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {isResolved
                  ? isHumanApproved
                    ? "Approved & Resolved via Governance (L3 Sign-off)"
                    : "Problem Solved by AI Agent"
                  : isPendingLogin
                  ? "Password Reset Successful — Login Required"
                  : pendingApprovalLevel
                  ? `Pending Level ${pendingApprovalLevel} (L${pendingApprovalLevel}) Governance Approval`
                  : "Forwarded to IT Support Team"}
              </h3>

              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  isResolved
                    ? "bg-emerald-600 text-white"
                    : isPendingLogin
                    ? "bg-indigo-600 text-white"
                    : "bg-amber-600 text-white"
                }`}
              >
                {isResolved
                  ? "RESOLVED"
                  : isPendingLogin
                  ? "PENDING LOGIN"
                  : pendingApprovalLevel
                  ? `AWAITING L${pendingApprovalLevel}`
                  : "FORWARDED"}
              </span>
            </div>

            <p className="text-xs text-slate-600 mt-0.5">
              {isResolved
                ? isHumanApproved
                  ? "All required tiers have been completed. Ticket marked SOLVED."
                  : "The AI agent resolved the issue and verified that everything is working properly."
                : isPendingLogin
                ? "Your temporary password is ready. Please use the existing login portal above to verify your account."
                : pendingApprovalLevel
                ? `Tier sign-off in progress. Must pass Level ${pendingApprovalLevel} approval before resolution.`
                : "This request requires human review or manager approval and was sent to the IT team."}
            </p>
          </div>
        </div>
      </div>

      {/* Rationale & Remediation Details */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-3">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            {isResolved ? "Resolution Details" : "Current Status & Next Steps"}
          </span>

          <p className="text-slate-800 text-xs sm:text-sm leading-relaxed font-medium">
            {response.resolution || response.reason}
          </p>
        </div>

        {/* Temporary Password Display */}
        {response.new_password && (
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <KeyRound className="w-4 h-4 text-amber-600 shrink-0" />

              <span className="font-semibold text-slate-800">
                New Temporary Password:
              </span>

              <span className="font-mono font-bold text-xs bg-white px-2 py-0.5 rounded border border-amber-300 text-indigo-700 select-all">
                {response.new_password}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleCopy(response.new_password!)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 hover:text-amber-950 cursor-pointer self-start sm:self-auto"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied to clipboard</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy password</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Executed Tools Sequence */}
        {agentTools.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Actions Taken by AI Agent
            </span>

            <div className="flex flex-wrap items-center gap-2">
              {agentTools.map((action, idx) => (
                <React.Fragment key={idx}>
                  <span className="px-2.5 py-1 bg-slate-100 border border-slate-300 rounded-lg text-xs font-mono font-semibold text-slate-800 shadow-2xs">
                    {action}()
                  </span>

                  {idx < agentTools.length - 1 && (
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Matched SOP Knowledge Rules */}
        {response.knowledge && response.knowledge.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Troubleshooting Guidelines Used
            </span>

            <div className="space-y-1.5">
              {response.knowledge.map((sop, i) => (
                <div
                  key={i}
                  className="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200/80 font-mono text-[11px]"
                >
                  {sop}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Successful Resolution Message */}
      {isResolved && (
        <div className="p-3 bg-emerald-100/80 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex items-center justify-between">
          <span className="font-semibold">
            {isHumanApproved
              ? "Authorization logged in enterprise directory. Ticket status updated to RESOLVED!"
              : scenario.category === "password"
              ? "Employee login successfully verified. Ticket status updated to RESOLVED!"
              : scenario.category === "vpn"
              ? "VPN service restarted and connection verified active!"
              : scenario.category === "disk"
              ? "Temporary cache and junk files purged. Storage space is now healthy!"
              : scenario.category === "printer"
              ? "Print spooler restarted and queue cleared. Printer is ready!"
              : "All steps completed! System operational health has been verified."}
          </span>
        </div>
      )}
    </div>
  );
};
