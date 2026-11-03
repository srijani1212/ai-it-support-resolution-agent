import React, { useState } from "react";
import {
  Activity,
  Terminal,
  Database,
  Wrench,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertOctagon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { AgentActivityEvent } from "../types";

interface AgentStepsTimelineProps {
  events: AgentActivityEvent[];
}

export const AgentStepsTimeline: React.FC<AgentStepsTimelineProps> = ({ events }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!events || events.length === 0) return null;

  const getEventIcon = (eventType: AgentActivityEvent["event_type"]) => {
    switch (eventType) {
      case "ticket_received":
        return <Terminal className="w-3.5 h-3.5 text-blue-600" />;
      case "rag_retrieved":
        return <Database className="w-3.5 h-3.5 text-indigo-600" />;
      case "tool_selected":
        return <Wrench className="w-3.5 h-3.5 text-amber-600" />;
      case "tool_result":
        return <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />;
      case "verification":
        return <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />;
      case "resolved":
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case "escalation":
        return <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
            View Agent Execution Timeline ({events.length} observable steps)
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>{isOpen ? "Hide Steps" : "Show Steps"}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-5 pt-1 border-t border-slate-100 bg-slate-50/50 space-y-3">
          <div className="relative pl-6 space-y-2.5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {events.map((event, idx) => (
              <div key={idx} className="relative">
                <div className="absolute -left-6 top-1.5 w-5 h-5 rounded-full bg-white border border-slate-300 flex items-center justify-center shadow-xs">
                  {getEventIcon(event.event_type)}
                </div>

                <div className="bg-white border border-slate-200/80 rounded-lg p-2.5 text-xs shadow-2xs">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-slate-400">
                      Step #{event.step || idx + 1}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-700">
                      {event.event_type.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-slate-700 text-xs">{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
