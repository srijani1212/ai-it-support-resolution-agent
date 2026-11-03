import React, { useState, useEffect } from "react";
import {
  X,
  ShieldCheck,
  Clock,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  Building,
  User,
  FileText,
  Send,
  HelpCircle,
} from "lucide-react";
import { DemoScenario, ApprovalStep } from "../types";

interface ApprovalHierarchyModalProps {
  scenario: DemoScenario;
  onClose: () => void;
  onApproveStep?: (level: number, note: string, updatedSteps: ApprovalStep[]) => void;
  initialSteps?: ApprovalStep[];
}

export const ApprovalHierarchyModal: React.FC<ApprovalHierarchyModalProps> = ({
  scenario,
  onClose,
  onApproveStep,
  initialSteps,
}) => {
  const [steps, setSteps] = useState<ApprovalStep[]>(initialSteps || scenario.approvalHierarchy);
  const [approvalNote, setApprovalNote] = useState("");
  const [activeTab, setActiveTab] = useState<"hierarchy" | "sla">("hierarchy");
  const [humanApprovedSuccess, setHumanApprovedSuccess] = useState(false);

  useEffect(() => {
    if (initialSteps) {
      setSteps(initialSteps);
    }
  }, [initialSteps]);

  const handleSimulateApproval = (level: number) => {
    const note =
      approvalNote.trim() ||
      "Human-in-the-loop verification approved following company ITSM guidelines.";
    const updated = steps.map((s) => {
      if (s.level === level) {
        return {
          ...s,
          status: "approved" as const,
          timestamp: new Date().toLocaleTimeString(),
          decisionNote: note,
        };
      }
      return s;
    });
    setSteps(updated);
    setHumanApprovedSuccess(true);
    if (onApproveStep) {
      onApproveStep(level, note, updated);
    }
  };

  const getStatusBadge = (status: ApprovalStep["status"]) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Approved
          </span>
        );
      case "auto_waived":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <ShieldCheck className="w-3 h-3 text-indigo-500" />
            Auto-Waived (SOP)
          </span>
        );
      case "escalated":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Escalated to Human
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <X className="w-3 h-3 text-rose-600" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-300">
            <Clock className="w-3 h-3 text-slate-400" />
            Pending Human Review
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Governance & Human-in-the-Loop (HITL)
                </h2>
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {scenario.ticketId}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Service Level Agreement (SLA) & Multi-Tier Approval Chain
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-200 flex gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("hierarchy")}
            className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === "hierarchy"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Approval Hierarchy ({steps.length} Tiers)</span>
          </button>
          <button
            onClick={() => setActiveTab("sla")}
            className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === "sla"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>SLA Targets & Metrics</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700">
          {activeTab === "hierarchy" && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 flex items-start gap-3 text-xs">
                <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-slate-600 leading-relaxed">
                  ITSM compliance requires multi-tiered authorization for sensitive changes, capital purchases, and escalated incidents. Low-risk operations are pre-waived under automated standard operating procedures (SOP).
                </p>
              </div>

              {humanApprovedSuccess && (() => {
                const pending = steps.filter((s) => s.status === "pending" || s.status === "escalated");
                const isFullyApproved = pending.length === 0;
                const nextStep = pending[0];
                return (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                      isFullyApproved
                        ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                        : "bg-amber-50 border-amber-300 text-amber-900"
                    }`}
                  >
                    {isFullyApproved ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <span className="font-semibold">
                      {isFullyApproved
                        ? "✨ All Approval Tiers Completed (L1 -> L2 -> L3)! Ticket has passed final authorization and is now marked RESOLVED."
                        : `Signed & Logged! Ticket now requires ${nextStep?.role || "Level 3"} approval to be fully resolved.`}
                    </span>
                  </div>
                );
              })()}

              {/* Approval Steps Timeline */}
              <div className="space-y-3">
                {steps.map((step, idx) => {
                  const isPending = step.status === "pending" || step.status === "escalated";
                  return (
                    <div
                      key={step.level}
                      className={`p-4 rounded-xl border transition-all ${
                        isPending
                          ? "bg-amber-50/40 border-amber-300 ring-1 ring-amber-300/30"
                          : "bg-white border-slate-200 shadow-2xs"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                            {step.level}
                          </span>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900">
                              {step.role}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3 text-slate-400" />
                                {step.approverName}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Building className="w-3 h-3 text-slate-400" />
                                {step.department}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {getStatusBadge(step.status)}
                          {step.timestamp && (
                            <span className="text-[10px] font-mono text-slate-400">
                              {step.timestamp}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-2.5 text-xs text-slate-600 flex items-start gap-2">
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="italic leading-relaxed">{step.decisionNote}</span>
                      </div>

                      {/* Human-in-the-loop Interactive Action for Pending Approvers */}
                      {isPending && (
                        <div className="mt-3 pt-3 border-t border-amber-200/80 bg-amber-50/60 -mx-4 -mb-4 p-3 rounded-b-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="text-[11px] text-amber-900 font-medium">
                            Action required by <strong>{step.approverName}</strong>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSimulateApproval(step.level)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Sign & Approve as {step.approverName.split(" ")[0]}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "sla" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Response SLA Target
                  </span>
                  <div className="text-lg font-bold text-indigo-700">
                    {scenario.sla.responseTimeLabel}
                  </div>
                  <p className="text-[11px] text-slate-500">First diagnostic acknowledgment</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Resolution SLA Target
                  </span>
                  <div className="text-lg font-bold text-indigo-700">
                    {scenario.sla.resolutionTimeLabel}
                  </div>
                  <p className="text-[11px] text-slate-500">End-to-end incident fix</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Historical Compliance
                  </span>
                  <div className="text-lg font-bold text-emerald-600">
                    {scenario.sla.complianceRate}
                  </div>
                  <p className="text-[11px] text-slate-500">Tier {scenario.priority} incidents</p>
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>SLA Countdown Timer</span>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono">
                    {scenario.sla.remainingMinutes} mins remaining ({scenario.sla.status})
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        (scenario.sla.elapsedMinutes /
                          scenario.sla.targetResolutionMinutes) *
                          100
                      )}%`,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Elapsed: {scenario.sla.elapsedMinutes}m</span>
                  <span>Target: {scenario.sla.targetResolutionMinutes}m</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                <h4 className="font-bold text-slate-800">Assigned Routing Policy</h4>
                <p className="text-slate-600 leading-relaxed">
                  <strong>{scenario.sla.tier}</strong>: Incident is processed by automated agents for instant remediation. If resolution exceeds {scenario.sla.resolutionTimeLabel}, it automatically escalates to Level 2 On-Call support.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold text-xs transition-colors cursor-pointer"
          >
            Close Governance Panel
          </button>
        </div>
      </div>
    </div>
  );
};
