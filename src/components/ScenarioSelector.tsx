import React, { useState, useMemo } from "react";
import {
  KeyRound,
  HardDrive,
  Printer,
  FileQuestion,
  ExternalLink,
  Clock,
  Search,
  Radio,
  Shield,
  Network,
  AlertOctagon,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { DemoScenario } from "../types";
import rawTicketsData from "../data/tickets.json";

export const SCENARIOS: DemoScenario[] = rawTicketsData as DemoScenario[];

interface ScenarioSelectorProps {
  selectedId?: string;
  onSelectScenario?: (scenario: DemoScenario) => void;
  loading?: boolean;
}

export const ScenarioSelector: React.FC<ScenarioSelectorProps> = () => {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 12;

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "vpn":
        return <Radio className="w-4 h-4 text-indigo-500" />;
      case "password":
        return <KeyRound className="w-4 h-4 text-amber-500" />;
      case "mfa":
        return <Shield className="w-4 h-4 text-emerald-500" />;
      case "network":
        return <Network className="w-4 h-4 text-blue-500" />;
      case "outage":
        return <AlertOctagon className="w-4 h-4 text-rose-500" />;
      case "disk":
        return <HardDrive className="w-4 h-4 text-rose-500" />;
      case "printer":
        return <Printer className="w-4 h-4 text-amber-500" />;
      default:
        return <FileQuestion className="w-4 h-4 text-indigo-500" />;
    }
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

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return SCENARIOS.filter((sc) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        sc.ticketId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sc.ticket.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sc.reporter.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat =
        selectedCategory === "all" ||
        sc.category.toLowerCase() === selectedCategory.toLowerCase();

      const matchesPriority =
        selectedPriority === "all" ||
        sc.priority.toLowerCase() === selectedPriority.toLowerCase();

      return matchesSearch && matchesCat && matchesPriority;
    });
  }, [searchQuery, selectedCategory, selectedPriority]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredTickets.length / PAGE_SIZE) || 1;
  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredTickets.slice(start, start + PAGE_SIZE);
  }, [filteredTickets, currentPage]);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const handlePriorityChange = (priority: string) => {
    setSelectedPriority(priority);
    setCurrentPage(1);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>Enterprise Support Tickets Queue</span>
            <span className="text-xs font-mono font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
              {SCENARIOS.length} Total Tickets
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Select any ticket below to open its dedicated AI remediation workspace.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>SLA: 99.8%</span>
          </span>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-50/70 p-3 rounded-xl border border-slate-200">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tickets by ID, title, keywords..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "all", label: "All" },
            { id: "network", label: "Network" },
            { id: "password", label: "Password" },
            { id: "mfa", label: "MFA" },
            { id: "outage", label: "Outage" },
            { id: "vpn", label: "VPN" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryChange(cat.id)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-2xs"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedPriority}
            onChange={(e) => handlePriorityChange(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Tickets Grid */}
      {paginatedTickets.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <FileQuestion className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No tickets found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {paginatedTickets.map((scenario) => {
            return (
              <a
                key={scenario.id}
                id={`card-scenario-${scenario.id}`}
                href={`?ticket=${encodeURIComponent(scenario.id)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 text-left rounded-xl border transition-all text-xs flex flex-col justify-between group bg-white hover:bg-indigo-50/40 hover:border-indigo-400 hover:shadow-md border-slate-200 text-slate-700 select-none cursor-pointer no-underline"
              >
                <div>
                  <div className="flex items-center justify-between gap-1.5 mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 group-hover:bg-indigo-100 transition-colors">
                        {scenario.ticketId}
                      </span>
                      <span className="text-[10px] font-mono font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded capitalize">
                        {scenario.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getPriorityColor(
                          scenario.priority
                        )}`}
                      >
                        {scenario.priority}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        <span>SLA {scenario.sla?.resolutionTimeLabel || "15m"}</span>
                      </span>
                    </div>
                  </div>

                  <div className="block">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {getCategoryIcon(scenario.category)}
                        <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 text-sm transition-colors truncate">
                          {scenario.title}
                        </h3>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0 transition-colors" />
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-2">
                      "{scenario.ticket}"
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium truncate max-w-[160px]">
                      Reporter: {scenario.reporter}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {scenario.ticketId}
                    </span>
                  </div>

                  <div className="w-full py-2 px-2.5 bg-indigo-50 group-hover:bg-indigo-600 text-indigo-700 group-hover:text-white font-semibold rounded-lg text-center flex items-center justify-center gap-1.5 transition-colors text-xs shadow-2xs">
                    <span>Open Ticket</span>
                    <span>&rarr;</span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-600">
          <span className="font-mono text-slate-500">
            Showing {(currentPage - 1) * PAGE_SIZE + 1} -{" "}
            {Math.min(currentPage * PAGE_SIZE, filteredTickets.length)} of {filteredTickets.length} tickets
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono font-semibold">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
