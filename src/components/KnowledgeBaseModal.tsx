import React, { useState, useMemo } from "react";
import {
  X,
  BookOpen,
  Copy,
  Check,
  Download,
  Shield,
  KeyRound,
  Network,
  AlertOctagon,
  Radio,
} from "lucide-react";
import kbMarkdown from "../data/knowledge_base.md?raw";
import { parseKnowledgeBaseMarkdown, KnowledgeArticle } from "../utils/markdownKb";

interface KnowledgeBaseModalProps {
  onClose: () => void;
}

export const KnowledgeBaseModal: React.FC<KnowledgeBaseModalProps> = ({
  onClose,
}) => {
  const articles = useMemo(() => parseKnowledgeBaseMarkdown(kbMarkdown), []);
  const [selectedArticleId, setSelectedArticleId] = useState(articles[0]?.id || "escalation-matrix");
  const [activeTab, setActiveTab] = useState<"formatted" | "markdown">("formatted");
  const [copied, setCopied] = useState(false);

  const currentArticle: KnowledgeArticle =
    articles.find((a) => a.id === selectedArticleId) || articles[0];

  const getCategoryIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
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
      default:
        return <BookOpen className="w-4 h-4 text-slate-500" />;
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([kbMarkdown], {
      type: "text/markdown",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "knowledge_base.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Enterprise IT Knowledge Base & SOPs
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Source: /src/data/knowledge_base.md • {articles.length} Runbook Articles
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadMarkdown}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
              title="Download entire Knowledge Base as Markdown"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Download .MD</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Sidebar + Main Viewer */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Article List Sidebar */}
          <div className="w-full md:w-72 border-r border-slate-200 p-3 bg-slate-50/50 overflow-y-auto space-y-1">
            <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Standard Operating Procedures
            </div>
            {articles.map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={() => setSelectedArticleId(doc.id)}
                className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center gap-2.5 cursor-pointer ${
                  selectedArticleId === doc.id
                    ? "bg-indigo-50 border-indigo-300 text-indigo-950 font-bold shadow-2xs"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {getCategoryIcon(doc.category)}
                <div className="truncate flex-1">
                  <div className="truncate">{doc.title}</div>
                  <div className="text-[10px] text-slate-400 font-mono capitalize">
                    {doc.category}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Article Content Viewer */}
          <div className="flex-1 flex flex-col min-h-0 bg-white">
            {/* View Mode Tabs */}
            <div className="px-4 py-2 border-b border-slate-200 flex items-center justify-between bg-slate-50/30">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("formatted")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    activeTab === "formatted"
                      ? "bg-indigo-600 text-white shadow-2xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Formatted Runbook
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("markdown")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    activeTab === "markdown"
                      ? "bg-indigo-600 text-white shadow-2xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Raw Markdown
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(currentArticle?.markdown || "")
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy MD</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-5 overflow-y-auto">
              {activeTab === "formatted" && currentArticle && (
                <div className="space-y-4 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wide bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                      {currentArticle.category}
                    </span>
                    <h2 className="text-lg font-bold text-slate-900">
                      {currentArticle.title}
                    </h2>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Automated Remediation Rules & Steps:
                    </h4>
                    <ul className="space-y-1.5">
                      {currentArticle.rules.map((rule, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-slate-700 flex items-start gap-2 bg-white p-2 rounded-lg border border-slate-200/80 font-mono"
                        >
                          <span className="text-indigo-600 font-bold shrink-0">{idx + 1}.</span>
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {currentArticle.keywords.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        RAG Retrieval Keywords:
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {currentArticle.keywords.map((kw, i) => (
                          <span
                            key={i}
                            className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200 font-mono"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "markdown" && currentArticle && (
                <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap selection:bg-indigo-500 selection:text-white">
                  {currentArticle.markdown}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
