import React, { useState, useEffect } from "react";
import {
  Bot,
  GitFork,
  LifeBuoy,
} from "lucide-react";
import { ScenarioSelector, SCENARIOS } from "./components/ScenarioSelector";
import { ArchitectureModal } from "./components/ArchitectureModal";
import { StandaloneTicketView } from "./components/StandaloneTicketView";
import { DemoScenario } from "./types";

export default function App() {
  const [activeScenario, setActiveScenario] = useState<DemoScenario | null>(null);
  const [showArchModal, setShowArchModal] = useState(false);

  // Check URL on startup and on popstate for single-ticket view
  useEffect(() => {
    const parseUrlTicket = () => {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const ticketParam = params.get("ticket");

        if (ticketParam) {
          const matched = SCENARIOS.find(
            (s) =>
              s.id.toLowerCase() === ticketParam.toLowerCase() ||
              s.ticketId.toLowerCase() === ticketParam.toLowerCase()
          );
          if (matched) {
            setActiveScenario(matched);
            return;
          }
        }
        setActiveScenario(null);
      }
    };

    parseUrlTicket();
    window.addEventListener("popstate", parseUrlTicket);
    return () => window.removeEventListener("popstate", parseUrlTicket);
  }, []);

  const handleSelectScenario = (scenario: DemoScenario) => {
    setActiveScenario(scenario);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("ticket", scenario.id);
      window.history.pushState({}, "", url.toString());
    }
  };

  const handleBackToQueue = () => {
    setActiveScenario(null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("ticket");
      window.history.pushState({}, "", url.pathname + (url.search ? url.search : ""));
    }
  };

  // If a ticket scenario is active, render its dedicated resolution workspace
  if (activeScenario) {
    return (
      <StandaloneTicketView
        scenario={activeScenario}
        onBack={handleBackToQueue}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                IT Support Ticket Queue
              </h1>
              <p className="text-xs text-slate-500">
                Autonomous AI Helpdesk • Select any ticket to inspect and execute remediation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-open-arch"
              onClick={() => setShowArchModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 cursor-pointer"
            >
              <GitFork className="w-3.5 h-3.5 text-slate-500" />
              <span>Architecture</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard - Pure Tickets Queue */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Ticket Queue Component */}
        <ScenarioSelector />

        {/* Informational Help Banner */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                Autonomous AI IT Helpdesk Resolution
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Clicking on any ticket above opens its dedicated resolution workspace with live execution telemetry.
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>AI Helpdesk Agent Online</span>
          </div>
        </div>
      </main>

      {/* Modals */}
      <ArchitectureModal
        isOpen={showArchModal}
        onClose={() => setShowArchModal(false)}
      />
    </div>
  );
}

