import React from "react";
import { GitFork, X, ArrowRight, ShieldCheck, Database, Cpu, Wrench, CheckCircle2 } from "lucide-react";

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <GitFork className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-800 text-sm">
              Agent Architecture & LangGraph Flow
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Step-by-step agent flow */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-3 text-sm">Core Operational Flow:</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="font-bold text-indigo-700 block mb-1">1. Ticket & Mock RAG</span>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Employee ticket is parsed. Mock RAG retrieves SOP runbooks for VPN or Password Auth.
                </p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="font-bold text-indigo-700 block mb-1">2. LLaMA 3.3 70B</span>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  LLM analyzes ticket + SOPs and invokes tools using genuine function/tool calling.
                </p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="font-bold text-indigo-700 block mb-1">3. Tool Execution</span>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Tool mutates the in-memory mock environment and returns execution telemetry back to LLM.
                </p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="font-bold text-indigo-700 block mb-1">4. Verification</span>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Agent performs post-remediation check tool before marking RESOLVED or ESCALATE.
                </p>
              </div>
            </div>
          </div>

          {/* Safety Guarantees */}
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-lg p-4">
            <h4 className="font-semibold text-indigo-950 mb-2">Agent Safety Constraints:</h4>
            <ul className="space-y-1.5 text-indigo-900 list-disc list-inside text-[11px]">
              <li><strong>Maximum 6 steps:</strong> Loop prevention guard escalates if unable to converge.</li>
              <li><strong>No unverified resolutions:</strong> Success is never claimed without status check.</li>
              <li><strong>Safe Escalation:</strong> Unknown issues or unrepairable states (e.g. bad certificate) escalate to Tier 2.</li>
              <li><strong>In-Memory Isolation:</strong> No real external credentials or network services are touched.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
