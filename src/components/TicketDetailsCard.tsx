import React, { useState, useEffect } from "react";
import {
  Sparkles,
  User,
  Tag,
  Clock,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
  KeyRound,
  HardDrive,
  Printer,
  FileQuestion,
} from "lucide-react";
import { DemoScenario, EnvironmentState, AgentResponse } from "../types";

interface TicketDetailsCardProps {
  scenario: DemoScenario;
  onRunAgent: (ticketText: string) => void;
  loading: boolean;
  agentResponse: AgentResponse | null;
  onResetIssue: () => void;
}

export const TicketDetailsCard: React.FC<TicketDetailsCardProps> = ({
  scenario,
  onRunAgent,
  loading,
  agentResponse,
  onResetIssue,
}) => {
  const [ticketText, setTicketText] = useState(scenario.ticket);

  useEffect(() => {
    setTicketText(scenario.ticket);
  }, [scenario.id, scenario.ticket]);

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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "password":
        return <KeyRound className="w-4 h-4 text-amber-600" />;
      case "vpn":
        return <ShieldAlert className="w-4 h-4 text-rose-600" />;
      case "disk":
        return <HardDrive className="w-4 h-4 text-rose-600" />;
      case "printer":
        return <Printer className="w-4 h-4 text-amber-600" />;
      default:
        return <FileQuestion className="w-4 h-4 text-indigo-600" />;
    }
  };

  const isResolved = agentResponse?.status === "RESOLVED";
  const isEscalated = agentResponse?.status === "ESCALATE";

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
      {/* Header with Ticket ID, Title, and Priority */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700">
            {getCategoryIcon(scenario.category)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200">
                {scenario.ticketId}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {scenario.title}
              </h2>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityColor(
                  scenario.priority
                )}`}
              >
                {scenario.priority} Priority
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Assigned to: <strong className="text-slate-700">AI Helpdesk Support Agent</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Status Badge */}
          {agentResponse ? (
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                isResolved
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : "bg-amber-100 text-amber-800 border border-amber-300"
              }`}
            >
              {isResolved ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              )}
              <span>{isResolved ? "RESOLVED" : "FORWARDED"}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Pending Action</span>
            </span>
          )}

          <button
            onClick={() => {
              setTicketText(scenario.ticket);
              onResetIssue();
            }}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Reset ticket to initial state"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Ticket Meta Details */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-slate-400 shrink-0" />
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-medium">
              Employee / Department
            </span>
            <span className="font-semibold text-slate-800">
              {scenario.reporter}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-slate-400 shrink-0" />
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-medium">
              Issue Category
            </span>
            <span className="font-semibold text-slate-800 capitalize">
              {scenario.category} Support
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-medium">
              Time Logged
            </span>
            <span className="font-semibold text-slate-800">
              Today at 08:30 AM
            </span>
          </div>
        </div>
      </div>

      {/* Ticket Description Area */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 block">
          Employee Request & Issue Description
        </label>
        <textarea
          value={ticketText}
          onChange={(e) => setTicketText(e.target.value)}
          rows={3}
          className="w-full text-xs sm:text-sm font-mono bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl p-3 text-slate-800 resize-none transition-all outline-hidden leading-relaxed"
          placeholder="Describe the IT issue..."
        />
      </div>

      {/* Resolution Action Button */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-slate-500 text-center sm:text-left">
          The AI agent checks troubleshooting rules, runs diagnostics, and fixes the issue automatically.
        </p>

        <button
          id="btn-resolve-ticket"
          onClick={() => onRunAgent(ticketText)}
          disabled={loading || !ticketText.trim()}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all cursor-pointer shrink-0"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              <span>AI Agent Troubleshooting...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Resolve Ticket with AI Agent</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
