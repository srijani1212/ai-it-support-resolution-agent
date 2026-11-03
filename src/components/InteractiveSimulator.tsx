import React, { useState, useEffect } from "react";
import {
  Sparkles,
  LogIn,
  Network,
  CheckCircle2,
  XCircle,
  RotateCcw,
  User,
  KeyRound,
  Server,
  Copy,
  Check,
  ArrowRight,
  ShieldAlert,
  HardDrive,
  Printer,
  FileQuestion,
  ExternalLink,
  Trash2,
  Clock,
  ShieldCheck,
  UserCheck,
  Lock,
  RefreshCw,
  Wifi,
  Smartphone,
  AlertTriangle,
  Activity,
} from "lucide-react";
import {
  DemoScenario,
  EnvironmentState,
  LoginResponse,
  VpnTestResponse,
  DiskTestResponse,
  PrinterTestResponse,
  AgentResponse,
  ApprovalStep,
} from "../types";
import { ApprovalHierarchyModal } from "./ApprovalHierarchyModal";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

interface InteractiveSimulatorProps {
  scenario: DemoScenario;
  environment: EnvironmentState;
  onRunAgent: (ticketText: string) => void;
  loading: boolean;
  agentResponse: AgentResponse | null;
  onResetIssue: () => void;
  onHumanApprove?: (level: number, note: string, updatedSteps: any[]) => void;
  approvalSteps?: ApprovalStep[];
// Called after the existing login portal verifies the temporary password
  onEmployeeLoginSuccess?: (result: LoginResponse) => void;  
  
}

export const InteractiveSimulator: React.FC<InteractiveSimulatorProps> = ({
  scenario,
  environment,
  onRunAgent,
  loading,
  agentResponse,
  onResetIssue,
  onHumanApprove,
  approvalSteps,
  onEmployeeLoginSuccess,
}) => {
  const [ticketText, setTicketText] = useState(scenario.ticket);
  const [usernameInput, setUsernameInput] = useState(
    scenario.reporter.split(" ")[0] || "emp_1042"
  );
  const [passwordInput, setPasswordInput] = useState("");
  const [copiedPass, setCopiedPass] = useState(false);

  // Auth portal tab ("login" or "change_password")
  const [authTab, setAuthTab] = useState<"login" | "change_password">("login");
  const [currentPasswordInput, setCurrentPasswordInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [changePasswordResult, setChangePasswordResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Live service interactions
  const [testingLogin, setTestingLogin] = useState(false);
  const [loginResult, setLoginResult] = useState<LoginResponse | null>(null);

  const [testingVpn, setTestingVpn] = useState(false);
  const [vpnResult, setVpnResult] = useState<VpnTestResponse | null>(null);

  const [testingDisk, setTestingDisk] = useState(false);
  const [diskResult, setDiskResult] = useState<DiskTestResponse | null>(null);

  const [testingPrinter, setTestingPrinter] = useState(false);
  const [printerResult, setPrinterResult] =
    useState<PrinterTestResponse | null>(null);

  const [testingMfa, setTestingMfa] = useState(false);
  const [mfaResult, setMfaResult] = useState<{
    status: "verified" | "out_of_sync" | "failed";
    message: string;
    device: string;
  } | null>(null);

  // Modal for Approval Hierarchy & SLA
  const [showHierarchyModal, setShowHierarchyModal] = useState(false);

  // Active issued temporary password from AI resolution or environment state
  const issuedPassword =
    agentResponse?.new_password || environment.temp_password || null;

  // Synchronize state when scenario changes
  useEffect(() => {
    setTicketText(scenario.ticket);
    setUsernameInput(scenario.reporter.split(" ")[0] || "emp_1042");
    setPasswordInput("");
    setAuthTab("login");
    setCurrentPasswordInput("");
    setNewPasswordInput("");
    setConfirmPasswordInput("");
    setChangePasswordResult(null);
    setLoginResult(null);
    setVpnResult(null);
    setDiskResult(null);
    setPrinterResult(null);
    setMfaResult(null);
    setCopiedPass(false);
  }, [scenario.id]);

  const isPasswordIssue = scenario.category === "password";

  const isVpnIssue =
    scenario.category === "vpn" ||
    (scenario.category === "outage" &&
      (scenario.title.toLowerCase().includes("vpn") ||
        scenario.ticket.toLowerCase().includes("vpn")));

  const isOutageIssue = scenario.category === "outage" && !isVpnIssue;
  const isNetworkIssue = scenario.category === "network";
  const isMfaIssue = scenario.category === "mfa";
  const isDiskIssue = scenario.category === "disk";
  const isPrinterIssue = scenario.category === "printer";

  const isTicketResolved = agentResponse?.status === "RESOLVED";

  // Authenticate / Login Action
const handleEmployeeLogin = async (e?: React.FormEvent) => {
  if (e) e.preventDefault();

  setTestingLogin(true);
  setLoginResult(null);

  try {
    const res = await fetch($/api/login, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: usernameInput,
        password: passwordInput,
      }),
    });

    if (!res.ok) {
      throw new Error("Login request failed.");
    }

    const data: LoginResponse = await res.json();

    setLoginResult(data);

    // Notify the parent only after successful login verification.
    if (
      data.success &&
      isPasswordIssue &&
      agentResponse?.status === "PENDING_LOGIN"
    ) {
      onEmployeeLoginSuccess?.(data);
    }
  } catch (err) {
    setLoginResult({
      success: false,
      message: "Unable to connect to the login service. Please try again.",
      password_status: "network_error",
    });
  } finally {
    setTestingLogin(false);
  }
};

  // Change Password Action
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPasswordInput.trim()) {
      setChangePasswordResult({
        success: false,
        message: "New password cannot be empty.",
      });
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      setChangePasswordResult({
        success: false,
        message: "New passwords do not match. Please verify.",
      });
      return;
    }

    setChangingPassword(true);
    setChangePasswordResult(null);

    try {
      const res = await fetch($/api/change-password, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: usernameInput,
          new_password: newPasswordInput.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        setChangePasswordResult({
          success: true,
          message: data.message || "Password successfully changed!",
        });

        // Pre-populate login form with the newly changed password
        setPasswordInput(newPasswordInput.trim());

        setTimeout(() => {
          setAuthTab("login");
        }, 1200);
      } else {
        setChangePasswordResult({
          success: false,
          message: data.message || "Failed to update password.",
        });
      }
    } catch (err) {
      setChangePasswordResult({
        success: false,
        message: "Failed to connect to password management server.",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  // VPN Tunnel Connect Action
  const handleVpnConnect = async () => {
    setTestingVpn(true);

    try {
      const res = await fetch($/api/test-vpn, { method: "POST" });
      const data: VpnTestResponse = await res.json();
      setVpnResult(data);
    } catch (err) {
      setVpnResult({
        status: "disconnected",
        ip_address: null,
        gateway: "Corporate VPN Gateway",
        tunnel_active: false,
      });
    } finally {
      setTestingVpn(false);
    }
  };

  // Test Disk Action
  const handleTestDisk = async () => {
    setTestingDisk(true);

    try {
      const res = await fetch($/api/test-disk, { method: "POST" });
      const data: DiskTestResponse = await res.json();
      setDiskResult(data);
    } catch (err) {
      setDiskResult({
        status: "error",
        usage_percent: environment.disk_usage_percent || 99,
        free_gb: environment.disk_free_gb || 5,
        total_gb: environment.total_disk_gb || 500,
        temp_cache_gb: environment.temp_files_gb || 45,
        details: "Failed to query storage subsystem.",
      });
    } finally {
      setTestingDisk(false);
    }
  };

  // Test Printer Action
  const handleTestPrinter = async () => {
    setTestingPrinter(true);

    try {
      const res = await fetch($/api/test-printer, { method: "POST" });
      const data: PrinterTestResponse = await res.json();
      setPrinterResult(data);
    } catch (err) {
      setPrinterResult({
        status: "error",
        printer_id: "PRN-FL3-EAST",
        model: "HP LaserJet Enterprise MFP M528",
        queue_status: environment.print_spooler_status || "corrupted",
        pending_jobs: environment.pending_print_jobs || 7,
        details: "Failed to communicate with print spooler service.",
      });
    } finally {
      setTestingPrinter(false);
    }
  };

  // Test MFA Action
  const handleTestMfa = () => {
    setTestingMfa(true);

    setTimeout(() => {
      setTestingMfa(false);

      const isResolved = agentResponse?.remediation_success || false;

      setMfaResult({
        status: isResolved ? "verified" : "out_of_sync",
        message: isResolved
          ? "MFA security token synchronized successfully with authenticator app."
          : "MFA challenge timeout: Push notification not acknowledged or token time-drift detected.",
        device: "Corporate Mobile Authenticator (TOTP)",
      });
    }, 750);
  };

  const handleCopyPassword = (pass: string) => {
    navigator.clipboard.writeText(pass);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Interactive Workplace App & Support Console
            </span>
            <span className="font-mono text-[11px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 font-bold">
              {scenario.ticketId}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Test the live workplace issue, verify SLA compliance, or trigger the AI Autonomous Helpdesk Agent.
          </p>
        </div>

        {/* SLA and HITL Controls */}
        <div className="flex items-center gap-2">
          {scenario.sla && (
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>SLA Target: {scenario.sla.resolutionTimeLabel}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowHierarchyModal(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
            title="Inspect SLA parameters and Human-in-the-Loop approval tiers"
          >
            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Approval Hierarchy & SLA</span>
          </button>

          <button
            onClick={onResetIssue}
            className="text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 p-1.5 rounded-lg border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
            title="Reset this issue to initial state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Column: Authentic Workplace App Simulator */}
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  {isPasswordIssue
                    ? "Single Sign-On / Work Login Portal"
                    : isVpnIssue
                    ? "Corporate VPN Connection"
                    : isNetworkIssue
                    ? "Application & Service Access Status"
                    : isMfaIssue
                    ? "Corporate MFA & Authenticator Portal"
                    : isOutageIssue
                    ? "Service Availability Monitor"
                    : isDiskIssue
                    ? "Storage & Disk Status"
                    : isPrinterIssue
                    ? "Office Printer Status"
                    : "Workplace Service Status"}
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Status: {environment.vpn_connected ? "Online" : "Needs Help"}
              </span>
            </div>

            {/* If Password/SSO issue: Existing Login Portal */}
            {isPasswordIssue && (
              <div className="space-y-3">
                {/* Tab switcher: Sign In vs Change Password */}
                <div className="flex bg-slate-200/70 p-0.5 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab("login");
                      setChangePasswordResult(null);
                    }}
                    className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      authTab === "login"
                        ? "bg-white text-indigo-700 shadow-2xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab("change_password");
                      setLoginResult(null);
                    }}
                    className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      authTab === "change_password"
                        ? "bg-white text-indigo-700 shadow-2xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Change Password</span>
                  </button>
                </div>

                {/* SIGN IN TAB */}
                {authTab === "login" && (
                  <form onSubmit={handleEmployeeLogin} className="space-y-3">
                    {/* Temporary Password Notification */}
                    {issuedPassword && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-2 animate-fadeIn">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-900 flex items-center gap-1.5 text-[11px]">
                            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                            New Password from AI / Self-Service:
                          </span>

                          <button
                            type="button"
                            onClick={() => handleCopyPassword(issuedPassword)}
                            className="text-[10px] font-semibold text-amber-800 hover:text-amber-950 flex items-center gap-1 cursor-pointer"
                          >
                            {copiedPass ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-700">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded border border-amber-200">
                          <span className="font-mono font-bold text-indigo-700 text-xs tracking-wide">
                            {issuedPassword}
                          </span>

                          <button
                            type="button"
                            onClick={() => setPasswordInput(issuedPassword)}
                            className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200 transition-colors cursor-pointer"
                          >
                            Paste into Password &rarr;
                          </button>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Work Username
                      </label>
                      <div className="relative">
                        <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={usernameInput}
                          onChange={(e) => setUsernameInput(e.target.value)}
                          className="w-full pl-8.5 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-800"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-600">
                          Password
                        </label>

                        <button
                          type="button"
                          onClick={() => setAuthTab("change_password")}
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer underline"
                        >
                          Change password?
                        </button>
                      </div>

                      <div className="relative">
                        <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="password"
                          placeholder={
                            issuedPassword
                              ? "Enter your new password..."
                              : "Enter your password..."
                          }
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          className="w-full pl-8.5 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-800"
                        />
                      </div>
                    </div>

                    <button
                      id="btn-employee-signin"
                      type="submit"
                      disabled={testingLogin || loading}
                      className="w-full py-2.5 px-4 rounded-lg font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    >
                      {testingLogin ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          Checking login...
                        </span>
                      ) : (
                        <>
                          <LogIn className="w-3.5 h-3.5" />
                          <span>Log In</span>
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* CHANGE PASSWORD TAB */}
                {authTab === "change_password" && (
                  <form onSubmit={handleChangePasswordSubmit} className="space-y-3">
                    <div className="bg-indigo-50/60 p-3 rounded-lg border border-indigo-100 text-xs text-indigo-900 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Self-Service Password Change</span>
                      </div>
                      <p className="text-[11px] text-indigo-700/90 leading-relaxed">
                        Update your expired or temporary password here. After updating, you can immediately sign in.
                      </p>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Work Username / Login ID
                      </label>
                      <div className="relative">
                        <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={usernameInput}
                          onChange={(e) => setUsernameInput(e.target.value)}
                          className="w-full pl-8.5 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-800"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Current / Expired Password (Optional)
                      </label>
                      <div className="relative">
                        <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="password"
                          placeholder="Current password (if known)"
                          value={currentPasswordInput}
                          onChange={(e) => setCurrentPasswordInput(e.target.value)}
                          className="w-full pl-8.5 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-800"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        New Password
                      </label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="password"
                          placeholder="Enter new strong password..."
                          value={newPasswordInput}
                          onChange={(e) => setNewPasswordInput(e.target.value)}
                          className="w-full pl-8.5 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-800"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="password"
                          placeholder="Re-type new password..."
                          value={confirmPasswordInput}
                          onChange={(e) => setConfirmPasswordInput(e.target.value)}
                          className="w-full pl-8.5 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-800"
                        />
                      </div>
                    </div>

                    {changePasswordResult && (
                      <div
                        className={`p-3 rounded-lg border text-xs ${
                          changePasswordResult.success
                            ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                            : "bg-rose-50 border-rose-300 text-rose-900"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {changePasswordResult.success ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          )}
                          <span className="font-semibold">
                            {changePasswordResult.message}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setAuthTab("login")}
                        className="py-2 px-3 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                      >
                        Back to Login
                      </button>

                      <button
                        id="btn-submit-change-password"
                        type="submit"
                        disabled={changingPassword || !newPasswordInput}
                        className="flex-1 py-2 px-4 rounded-lg font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                      >
                        {changingPassword ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            Updating Password...
                          </span>
                        ) : (
                          <>
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Save & Change Password</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* If VPN issue: Realistic VPN Client */}
            {isVpnIssue && (
              <div className="space-y-3">
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Connection Status:</span>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                        environment.vpn_connected
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {environment.vpn_connected ? "Connected" : "Disconnected"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Assigned User:</span>
                    <span className="font-medium text-slate-800">{scenario.reporter}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Office Network:</span>
                    <span className="font-medium text-slate-800">Corporate HQ Network</span>
                  </div>
                </div>

                <button
                  id="btn-vpn-connect"
                  onClick={handleVpnConnect}
                  disabled={testingVpn || loading}
                  className="w-full py-2.5 px-4 rounded-lg font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  {testingVpn ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Connecting to VPN...
                    </span>
                  ) : (
                    <>
                      <Network className="w-3.5 h-3.5" />
                      <span>Connect to VPN</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* If Disk Storage issue: Storage Inspector */}
            {isDiskIssue && (
              <div className="space-y-3">
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Storage Usage:</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                        (environment.disk_usage_percent || 99) > 90
                          ? "bg-rose-100 text-rose-800 border border-rose-200"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}
                    >
                      {(environment.disk_usage_percent || 99) > 90
                        ? "99% FULL (Almost out of space)"
                        : "38% USED (Healthy)"}
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                    <div
                      className={`h-full transition-all duration-500 ${
                        (environment.disk_usage_percent || 99) > 90
                          ? "bg-rose-500"
                          : "bg-emerald-500"
                      }`}
                      style={{
                        width: `${environment.disk_usage_percent || 99}%`,
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="bg-slate-50 p-2 rounded border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Free Space:</span>
                      <strong className="text-slate-800">
                        {environment.disk_free_gb ?? 5} GB
                      </strong>{" "}
                      of {environment.total_disk_gb ?? 500} GB
                    </div>

                    <div className="bg-slate-50 p-2 rounded border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Junk & Temp Files:</span>
                      <strong
                        className={
                          (environment.temp_files_gb ?? 45) > 0
                            ? "text-rose-700 font-bold"
                            : "text-emerald-700"
                        }
                      >
                        {environment.temp_files_gb ?? 45} GB
                      </strong>
                    </div>
                  </div>
                </div>

                <button
                  id="btn-disk-inspect"
                  onClick={handleTestDisk}
                  disabled={testingDisk || loading}
                  className="w-full py-2.5 px-4 rounded-lg font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  {testingDisk ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Checking storage space...
                    </span>
                  ) : (
                    <>
                      <HardDrive className="w-3.5 h-3.5" />
                      <span>Check Storage Space</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* If Printer Spooler issue: Spooler Manager */}
            {isPrinterIssue && (
              <div className="space-y-3">
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Printer Location:</span>
                    <span className="font-semibold text-slate-800">3rd Floor Office Printer</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Printer Status:</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                        environment.print_spooler_status === "corrupted"
                          ? "bg-rose-100 text-rose-800 border border-rose-200"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}
                    >
                      {environment.print_spooler_status === "corrupted"
                        ? "STUCK / NOT PRINTING"
                        : "READY TO PRINT"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Stuck Documents:</span>
                    <span className="font-medium text-slate-800">
                      {environment.pending_print_jobs ?? 7} documents in queue
                    </span>
                  </div>
                </div>

                <button
                  id="btn-printer-test"
                  onClick={handleTestPrinter}
                  disabled={testingPrinter || loading}
                  className="w-full py-2.5 px-4 rounded-lg font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  {testingPrinter ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Sending test print...
                    </span>
                  ) : (
                    <>
                      <Printer className="w-3.5 h-3.5" />
                      <span>Send Test Print</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* If Network/Access issue */}
            {isNetworkIssue && (
              <div className="space-y-3">
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Target Application:</span>
                    <span className="font-semibold text-slate-800">
                      {scenario.title.toLowerCase().includes("erp")
                        ? "Corporate ERP System"
                        : scenario.title.toLowerCase().includes("portal")
                        ? "Internal Staff Portal"
                        : scenario.title.toLowerCase().includes("email")
                        ? "Enterprise Email System"
                        : scenario.title.toLowerCase().includes("file")
                        ? "Enterprise File Server"
                        : "Corporate Application Service"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Current Access Status:</span>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                        agentResponse?.status === "RESOLVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {agentResponse?.status === "RESOLVED"
                        ? "Access Permitted / Policy Authorized"
                        : "Access Restricted / Security Policy Block"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Assigned User:</span>
                    <span className="font-medium text-slate-800">{scenario.reporter}</span>
                  </div>
                </div>

                <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-lg text-xs text-indigo-950 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed text-indigo-900">
                    This ticket involves security policy evaluation. Trigger the Autonomous AI Agent on the right to evaluate access rules, check the knowledge base SOPs, and execute remediation or request managerial approval.
                  </p>
                </div>
              </div>
            )}

            {/* If MFA issue */}
            {isMfaIssue && (
              <div className="space-y-3">
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Target Authenticator:</span>
                    <span className="font-semibold text-slate-800">Corporate Mobile TOTP</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Token Sync Status:</span>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                        mfaResult?.status === "verified"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {mfaResult
                        ? mfaResult.status === "verified"
                          ? "Token Synchronized"
                          : "Token Desync Detected"
                        : "Verification Required"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Assigned Account:</span>
                    <span className="font-mono text-slate-700">{scenario.reporter}</span>
                  </div>
                </div>

                <button
                  id="btn-mfa-test"
                  onClick={handleTestMfa}
                  disabled={testingMfa || loading}
                  className="w-full py-2.5 px-4 rounded-lg font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  {testingMfa ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Sending Test MFA Challenge...
                    </span>
                  ) : (
                    <>
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Send Test MFA Challenge</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* If Outage issue (non-VPN) */}
            {isOutageIssue && (
              <div className="space-y-3">
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Incident Severity:</span>
                    <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[10px]">
                      P1 - Major Outage
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Scope of Impact:</span>
                    <span className="font-medium text-slate-800">Multi-User / Enterprise Cluster</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Current Status:</span>
                    <span className="text-amber-700 font-medium">Service Disrupted — Investigating</span>
                  </div>
                </div>

                <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-lg text-xs text-rose-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    Major service alert active. Trigger the AI Autonomous Agent to retrieve incident SOPs or initiate an escalation briefing.
                  </p>
                </div>
              </div>
            )}

            {/* General Workplace Diagnostic fallback */}
            {!isPasswordIssue &&
              !isVpnIssue &&
              !isDiskIssue &&
              !isPrinterIssue &&
              !isNetworkIssue &&
              !isMfaIssue &&
              !isOutageIssue && (
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Issue Category:</span>
                      <span className="font-semibold text-slate-800 capitalize">
                        {scenario.category}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Reporter:</span>
                      <span className="text-slate-800">{scenario.reporter}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Support State:</span>
                      <span className="text-amber-700 font-medium">
                        Active Ticket Under Triage
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-700 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>
                      Use the AI Agent console to diagnose and resolve this workplace issue.
                    </span>
                  </div>
                </div>
              )}
          </div>

          {/* Login Feedback */}
          {loginResult && (
            <div
              id="login-feedback-box"
              className={`p-3.5 rounded-lg border text-xs transition-all ${
                loginResult.success
                  ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                  : "bg-rose-50 border-rose-300 text-rose-900"
              }`}
            >
              <div className="flex items-start gap-2.5">
                {loginResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}

                <div className="space-y-1.5 flex-1">
                  <div className="font-bold text-[12px]">
                    {loginResult.success
                      ? "Authentication Succeeded"
                      : "Authentication Failed"}
                  </div>

                  <p className="text-[11px] leading-relaxed opacity-90 font-medium">
                    {loginResult.message}
                  </p>

                  {!loginResult.success && isPasswordIssue && (
                    <div className="pt-1.5 flex items-center gap-2 border-t border-rose-200">
                      <span className="text-[11px] text-rose-700">
                        Need to update your password?
                      </span>
                      <button
                        type="button"
                        onClick={() => setAuthTab("change_password")}
                        className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-white px-2 py-0.5 rounded border border-indigo-200 hover:border-indigo-300 transition-colors cursor-pointer shadow-2xs"
                      >
                        Change Password Now &rarr;
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Feedback for VPN */}
          {vpnResult &&
            (() => {
              const isConnected =
                vpnResult.tunnel_active || vpnResult.status === "connected";

              return (
                <div
                  id="vpn-feedback-box"
                  className={`p-3 rounded-lg border text-xs transition-all ${
                    isConnected
                      ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                      : "bg-rose-50 border-rose-300 text-rose-900"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {isConnected ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}

                    <div className="space-y-0.5">
                      <div className="font-bold text-[11px]">
                        {isConnected
                          ? "VPN Connected Successfully"
                          : "VPN Failed to Connect"}
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-90">
                        {isConnected
                          ? "You are now securely connected to the work network."
                          : "Could not connect to the work VPN. The VPN service is currently disconnected."}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

          {/* Feedback for Disk */}
          {diskResult &&
            (() => {
              const isHealthy = diskResult.usage_percent <= 90;

              return (
                <div
                  id="disk-feedback-box"
                  className={`p-3 rounded-lg border text-xs transition-all ${
                    isHealthy
                      ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                      : "bg-rose-50 border-rose-300 text-rose-900"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {isHealthy ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}

                    <div className="space-y-0.5">
                      <div className="font-bold text-[11px]">
                        {isHealthy
                          ? "Storage Space is Healthy"
                          : "Storage Almost Full (Critical)"}
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-90">
                        {isHealthy
                          ? `Drive C: has ${diskResult.free_gb} GB free out of ${diskResult.total_gb} GB (only ${diskResult.usage_percent}% used).`
                          : `Drive C: is ${diskResult.usage_percent}% full with only ${diskResult.free_gb} GB free. Junk files take up ${diskResult.temp_cache_gb} GB.`}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

          {/* Feedback for Printer */}
          {printerResult &&
            (() => {
              const isReady = printerResult.queue_status === "online";

              return (
                <div
                  id="printer-feedback-box"
                  className={`p-3 rounded-lg border text-xs transition-all ${
                    isReady
                      ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                      : "bg-rose-50 border-rose-300 text-rose-900"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {isReady ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}

                    <div className="space-y-0.5">
                      <div className="font-bold text-[11px]">
                        {isReady
                          ? "Test Page Printed Successfully"
                          : "Printer Queue is Stuck"}
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-90">
                        {isReady
                          ? "The printer is online and printed the test document without errors."
                          : `Cannot print: ${printerResult.pending_jobs} documents are stuck in the print queue.`}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

          {/* Feedback for MFA */}
          {mfaResult && (
            <div
              id="mfa-feedback-box"
              className={`p-3 rounded-lg border text-xs transition-all ${
                mfaResult.status === "verified"
                  ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                  : "bg-rose-50 border-rose-300 text-rose-900"
              }`}
            >
              <div className="flex items-start gap-2">
                {mfaResult.status === "verified" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}

                <div className="space-y-0.5">
                  <div className="font-bold text-[11px]">
                    {mfaResult.status === "verified"
                      ? "MFA Security Token Verified"
                      : "MFA Verification Failed"}
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    {mfaResult.message}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: IT Helpdesk Support Ticket & AI Agent Trigger */}
        <div className="bg-indigo-50/40 rounded-xl border border-indigo-100 p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-indigo-100 mb-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Support Ticket Details</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-indigo-100">
                  Priority: {scenario.priority}
                </span>

                {scenario.sla && (
                  <span className="text-[11px] font-mono font-semibold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-100">
                    SLA: {scenario.sla.resolutionTimeLabel}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2 mb-3 text-xs">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Employee / Reporter:</span>
                <span className="font-medium text-slate-800">{scenario.reporter}</span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Issue Category:</span>
                <span className="font-medium text-slate-800 capitalize">
                  {scenario.category}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>SLA Status:</span>
                <span className="font-semibold text-emerald-700">
                  {scenario.sla.status} ({scenario.sla.remainingMinutes}m remaining)
                </span>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Employee's Support Request
              </label>
              <textarea
                value={ticketText}
                onChange={(e) => setTicketText(e.target.value)}
                rows={3}
                className="w-full p-2.5 text-xs border border-indigo-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed font-mono"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              id="btn-fix-with-ai"
              onClick={() => onRunAgent(ticketText)}
              disabled={loading || !ticketText.trim()}
              className={`w-full py-3 px-5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                loading
                  ? "bg-indigo-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 hover:shadow-lg"
              }`}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>AI Agent Finding & Fixing Issue...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-white" />
                  <span>Fix Problem with AI Agent</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-1">
              <span>Autonomous remediation enabled</span>
              <button
                type="button"
                onClick={() => setShowHierarchyModal(true)}
                className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer underline flex items-center gap-1"
              >
                <UserCheck className="w-3 h-3" />
                <span>View Approval Chain</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Governance & SLA Hierarchy Modal */}
      {showHierarchyModal && (
        <ApprovalHierarchyModal
          scenario={scenario}
          initialSteps={approvalSteps}
          onClose={() => setShowHierarchyModal(false)}
          onApproveStep={(level, note, updatedSteps) => {
            if (onHumanApprove) {
              onHumanApprove(level, note, updatedSteps);
            }
          }}
        />
      )}
    </div>
  );
};