import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  Github,
  ArrowRight,
  Sparkles,
  GitBranch,
  FileJson,
  Terminal,
  Cpu,
  Scan,
  Download,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Circle,
  ExternalLink,
  RotateCcw,
  Play,
  Zap,
  Crown,
  Smartphone,
  KeyRound,
  LogIn,
  LogOut,
  User,
  Eye,
  EyeOff,
  Mail,
  Lock,
  AtSign,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type OS = "windows" | "macos" | "linux";
type ScanStatus = "idle" | "running" | "done" | "error";

interface LogEntry {
  step: string;
  message: string;
  data?: any;
}

/* ── step → icon & colour mapping ──────────────────────────────── */
const STEP_STYLE: Record<string, { icon: React.ReactNode; color: string }> = {
  clone:    { icon: <Download className="h-3.5 w-3.5" />, color: "text-sky-400" },
  detect:   { icon: <Cpu className="h-3.5 w-3.5" />,      color: "text-violet-400" },
  generate: { icon: <FileJson className="h-3.5 w-3.5" />,  color: "text-amber-400" },
  compose:  { icon: <GitBranch className="h-3.5 w-3.5" />, color: "text-rose-400" },
  build:    { icon: <Terminal className="h-3.5 w-3.5" />,  color: "text-teal-400" },
  run:      { icon: <Sparkles className="h-3.5 w-3.5" />,  color: "text-emerald-400" },
  done:     { icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: "text-emerald-400" },
  error:    { icon: <AlertCircle className="h-3.5 w-3.5" />,  color: "text-red-400" },
  end:      { icon: <Circle className="h-3.5 w-3.5" />,       color: "text-muted-foreground" },
};
const DEFAULT_STEP_STYLE = { icon: <Circle className="h-3.5 w-3.5" />, color: "text-muted-foreground" };

/* ── Log terminal component ────────────────────────────────────── */
const LogPanel = ({
  logs,
  status,
  onReset,
  doneData,
}: {
  logs: LogEntry[];
  status: ScanStatus;
  onReset: () => void;
  doneData: any;
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in-up">
      {/* terminal chrome */}
      <div className="rounded-2xl border border-white/[0.08] bg-[hsl(220,20%,5%)] shadow-2xl overflow-hidden">
        {/* title bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
            </div>
            <span className="text-[11px] font-mono text-muted-foreground ml-2">strixready — scan</span>
          </div>
          <div className="flex items-center gap-2">
            {status === "running" && (
              <span className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                LIVE
              </span>
            )}
            {(status === "done" || status === "error") && (
              <button
                onClick={onReset}
                className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                New Scan
              </button>
            )}
          </div>
        </div>

        {/* log body */}
        <div className="max-h-[260px] overflow-y-auto p-4 space-y-1 font-mono text-xs scrollbar-thin">
          {logs.map((log, i) => {
            const style = STEP_STYLE[log.step] || DEFAULT_STEP_STYLE;
            return (
              <div
                key={i}
                className={`flex items-start gap-2.5 py-1 px-2 rounded-md transition-colors ${
                  log.step === "error"
                    ? "bg-red-500/[0.06]"
                    : log.step === "done"
                    ? "bg-emerald-500/[0.06]"
                    : "hover:bg-white/[0.02]"
                }`}
              >
                <span className={`flex-shrink-0 mt-0.5 ${style.color}`}>{style.icon}</span>
                <span className={`flex-shrink-0 font-semibold uppercase tracking-wider text-[10px] min-w-[60px] mt-[1px] ${style.color}`}>
                  {log.step}
                </span>
                <span className="text-muted-foreground leading-relaxed">{log.message}</span>
              </div>
            );
          })}

          {status === "running" && (
            <div className="flex items-center gap-2.5 py-1 px-2 text-muted-foreground/50">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span className="animate-pulse">Waiting for next update…</span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* done banner */}
        {status === "done" && doneData && (
          <div className="border-t border-white/[0.06] bg-emerald-500/[0.05] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Environment is running
              {doneData.port && <span className="text-muted-foreground">on port {doneData.port}</span>}
            </div>
            {doneData.port && (
              <a
                href={`http://localhost:${doneData.port}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Open <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        )}

        {/* error banner */}
        {status === "error" && (
          <div className="border-t border-white/[0.06] bg-red-500/[0.05] px-4 py-3 flex items-center gap-2 text-red-400 text-xs font-medium">
            <AlertCircle className="h-4 w-4" />
            Scan failed — check the backend logs for details.
          </div>
        )}
      </div>
    </div>
  );
};

// Windows logo – four coloured panes (Microsoft brand colours), square 24×24 grid
const WindowsIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
    <path fill="#f25022" d="M0 3.2 11.2 1.6v10H0z" />
    <path fill="#7fba00" d="M12.8 1.4 24 0v11.6H12.8z" />
    <path fill="#00a4ef" d="M0 13.2h11.2V23L0 21.4z" />
    <path fill="#ffb900" d="M12.8 13.2H24V24l-11.2-1.4z" />
  </svg>
);

// Apple logo – Simple Icons 24×24 path (square viewBox, renders cleanly at small sizes)
const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="currentColor" aria-hidden="true">
    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
  </svg>
);

// Linux (Tux) – Simple Icons 24×24 path
// Tux penguin – hand-crafted 24×24 multi-colour SVG, legible at 16 px
const LinuxIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
    {/* body */}
    <ellipse cx="12" cy="15.5" rx="6" ry="6.8" fill="#1a1a1a" />
    {/* belly */}
    <ellipse cx="12" cy="16.5" rx="3.2" ry="4.8" fill="#e8e4d8" />
    {/* neck connector */}
    <rect x="9.5" y="8.5" width="5" height="2" rx="1" fill="#1a1a1a" />
    {/* head */}
    <circle cx="12" cy="6" r="3.6" fill="#1a1a1a" />
    {/* face patch */}
    <ellipse cx="12" cy="6.4" rx="2.1" ry="1.7" fill="#e8e4d8" />
    {/* eyes */}
    <circle cx="11" cy="5.6" r="0.55" fill="#fdd835" />
    <circle cx="13" cy="5.6" r="0.55" fill="#fdd835" />
    {/* pupils */}
    <circle cx="11.15" cy="5.65" r="0.25" fill="#1a1a1a" />
    <circle cx="13.15" cy="5.65" r="0.25" fill="#1a1a1a" />
    {/* beak */}
    <path d="M11.2 7.3 L12 8.6 L12.8 7.3z" fill="#fb8c00" />
    {/* feet */}
    <path d="M9 21.8 L7.2 23.4h4z" fill="#fb8c00" />
    <path d="M15 21.8 L13 23.4H17z" fill="#fb8c00" />
  </svg>
);

interface DocCard {
  icon: React.ReactNode;
  title: string;
  body: string;
  accent: string;
}

const CARDS: DocCard[] = [
  {
    icon: <Scan className="h-4 w-4" />,
    title: "Paste URL",
    body: "Drop any public GitHub repo link",
    accent: "border-emerald-500/25",
  },
  {
    icon: <Cpu className="h-4 w-4" />,
    title: "AI Detects Stack",
    body: "Reads manifests, Dockerfiles & CI configs",
    accent: "border-sky-500/25",
  },
  {
    icon: <FileJson className="h-4 w-4" />,
    title: "Config Generated",
    body: "devcontainer.json with correct images",
    accent: "border-violet-500/25",
  },
  {
    icon: <GitBranch className="h-4 w-4" />,
    title: "Compose Wired",
    body: "DBs & services auto-configured",
    accent: "border-amber-500/25",
  },
  {
    icon: <Download className="h-4 w-4" />,
    title: "One-Click Download",
    body: "Grab .devcontainer and go",
    accent: "border-rose-500/25",
  },
  {
    icon: <Terminal className="h-4 w-4" />,
    title: "Open in VS Code",
    body: "Reopen in Container — done",
    accent: "border-teal-500/25",
  },
];

const MarqueeCard = ({ card }: { card: DocCard }) => (
  <div
    className={`
      group flex-shrink-0 w-[220px] rounded-xl p-[1px]
      bg-gradient-to-b from-white/[0.06] to-transparent
    `}
  >
    <div
      className={`
        h-full rounded-xl bg-[hsl(220,20%,6%)] px-4 py-3
        border ${card.accent}
        transition-all duration-300
        group-hover:bg-[hsl(220,18%,8%)]
        group-hover:-translate-y-0.5
      `}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-muted-foreground group-hover:text-foreground transition-colors">
          {card.icon}
        </span>
        <span className="text-xs font-semibold text-foreground">{card.title}</span>
      </div>
      <p className="text-[11px] leading-snug text-muted-foreground">{card.body}</p>
    </div>
  </div>
);

const MarqueeRow = () => {
  const doubled = [...CARDS, ...CARDS];
  return (
    <div className="marquee-track relative w-full overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 z-10 bg-gradient-to-r from-[hsl(220,20%,4%)] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 z-10 bg-gradient-to-l from-[hsl(220,20%,4%)] to-transparent" />
      <div className="flex gap-4 w-max animate-marquee">
        {doubled.map((c, i) => (
          <MarqueeCard key={`${c.title}-${i}`} card={c} />
        ))}
      </div>
    </div>
  );
};

/* ── Auth types ────────────────────────────────────────────── */
interface AuthUser {
  name: string;
  email: string;
  avatar?: string;
}

const LandingPage = () => {
  const [repoUrl, setRepoUrl] = useState("");
  const [selectedOS, setSelectedOS] = useState<OS>("linux");

  /* ── Auth state ──────────────────────────────────────────── */
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim() || !authPassword.trim()) return;
    setAuthLoading(true);
    setTimeout(() => {
      const name = authTab === "signup" ? authName.trim() || authEmail.split("@")[0] : authEmail.split("@")[0];
      setUser({ name, email: authEmail.trim() });
      setAuthLoading(false);
      setLoginOpen(false);
      setAuthEmail("");
      setAuthPassword("");
      setAuthName("");
      toast.success(authTab === "signup" ? "Account created!" : "Welcome back!", {
        description: `Signed in as ${authEmail.trim()}`,
      });
    }, 900);
  };

  const handleLogout = () => {
    setUser(null);
    setUserMenuOpen(false);
    toast("Signed out successfully");
  };

  const initials = user
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "";
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const rootRef = useRef<HTMLDivElement>(null);

  /* ── SSE state ─────────────────────────────────────────────── */
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [doneData, setDoneData] = useState<any>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const loading = status === "running";

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("win")) setSelectedOS("windows");
    else if (ua.includes("mac")) setSelectedOS("macos");
    else setSelectedOS("linux");
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!rootRef.current) return;
      const rect = rootRef.current.getBoundingClientRect();
      setMousePos({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      });
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  /* ── clean up EventSource on unmount ────────────────────────── */
  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  const resetScan = useCallback(() => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    setLogs([]);
    setStatus("idle");
    setDoneData(null);
    setRepoUrl("");
  }, []);

  const handleGenerateOnly = async () => {
    if (!repoUrl.trim() || loading) return;
    setStatus("running");
    setLogs([{ step: "generate", message: "Sending repo for config generation…" }]);
    setDoneData(null);

    try {
      const response = await fetch("http://localhost:8000/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: repoUrl.trim(), os: selectedOS }),
      });

      if (!response.ok) throw new Error("Failed to generate config");

      const result = await response.json();
      setLogs((prev) => [
        ...prev,
        { step: "done", message: "Config files generated successfully!", data: result },
      ]);
      setStatus("done");
      setDoneData(result);
      toast.success("Config generated!", {
        description: "devcontainer.json and docker-compose.yml are ready.",
      });
    } catch {
      setLogs((prev) => [
        ...prev,
        { step: "error", message: "Could not connect to backend. Is it running?" },
      ]);
      setStatus("error");
      toast.error("Generation failed", {
        description: "Could not connect to the backend.",
      });
    }
  };

  const handleRun = () => {
    if (!repoUrl.trim() || loading) return;

    // Reset previous state
    setLogs([]);
    setDoneData(null);
    setStatus("running");

    const url = `http://localhost:8000/scan/stream?url=${encodeURIComponent(
      repoUrl.trim(),
    )}&os=${selectedOS}`;

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data: LogEntry = JSON.parse(event.data);
        setLogs((prev) => [...prev, data]);

        if (data.step === "done") {
          setStatus("done");
          setDoneData(data.data ?? null);
          toast.success("Environment ready!", {
            description: data.message,
          });
        }
        if (data.step === "error") {
          setStatus("error");
          toast.error("Scan failed", {
            description: data.message,
          });
        }
        if (data.step === "end") {
          es.close();
          eventSourceRef.current = null;
        }
      } catch {
        // ignore malformed events
      }
    };

    es.onerror = () => {
      setStatus("error");
      setLogs((prev) => [
        ...prev,
        { step: "error", message: "Connection lost — is the backend running?" },
      ]);
      es.close();
      eventSourceRef.current = null;
    };
  };

  const themeClass =
    selectedOS === "windows"
      ? "windows-theme"
      : selectedOS === "macos"
      ? "macos-theme"
      : "linux-theme";

  const osOptions: { value: OS; label: string; icon: React.ReactNode }[] = [
    { value: "windows", label: "Windows", icon: <WindowsIcon /> },
    { value: "macos", label: "macOS", icon: <AppleIcon /> },
    { value: "linux", label: "Linux", icon: <LinuxIcon /> },
  ];

  return (
    <div
      ref={rootRef}
      className={`h-screen flex flex-col ${themeClass} relative overflow-hidden bg-[hsl(220,20%,4%)]`}
    >
      {/* ── ambient orbs ───────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="orb-1 absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full bg-emerald-500/[0.07] blur-[100px]" />
        <div className="orb-2 absolute top-1/4 -right-20 h-[360px] w-[360px] rounded-full bg-sky-500/[0.05] blur-[90px]" />
        <div className="orb-3 absolute -bottom-20 left-1/3 h-[300px] w-[300px] rounded-full bg-violet-500/[0.04] blur-[100px]" />
      </div>

      {/* ── cursor spotlight ───────────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(550px circle at ${mousePos.x}% ${mousePos.y}%, rgba(74,222,128,0.06), transparent 60%)`,
        }}
      />

      {/* ── grid overlay ───────────────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      {/* ── nav ────────────────────────────────────────────────── */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-4 md:px-10 flex-shrink-0">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="relative h-9 w-9 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.15)] border border-emerald-500/20 group-hover:shadow-[0_0_25px_rgba(16,185,129,0.35)] group-hover:border-emerald-500/40 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <img
              src="/logo.png"
              alt="Strix logo"
              className="h-full w-full object-contain p-1 transform group-hover:scale-110 transition-transform duration-500 relative z-10"
            />
          </div>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 bg-[length:200%_auto] animate-gradient text-lg font-extrabold tracking-tight drop-shadow-[0_0_15px_rgba(52,211,153,0.2)] group-hover:drop-shadow-[0_0_20px_rgba(52,211,153,0.4)] transition-all duration-500">
            StrixReady
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* ── Premium tier button ────────────────────────────── */}
          <Dialog>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/[0.06] px-3.5 py-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 hover:bg-amber-500/[0.12] hover:border-amber-500/50 transition-all shadow-[0_0_12px_rgba(245,158,11,0.08)] hover:shadow-[0_0_18px_rgba(245,158,11,0.2)]">
                <Crown className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Premium</span>
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px] bg-[hsl(220,20%,6%)] border-white/[0.08] text-foreground">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2.5 text-xl font-bold">
                  <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <Crown className="h-4 w-4 text-amber-400" />
                  </span>
                  StrixReady Premium
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Unlock the full power of instant dev environments — from any device, anywhere.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-3">
                {/* Free tier */}
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-foreground">Free</span>
                    <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08]">Current</span>
                  </div>
                  <ul className="space-y-2">
                    {[
                      "Public GitHub repositories",
                      "devcontainer.json generation",
                      "docker-compose.yml generation",
                      "Windows, macOS & Linux support",
                    ].map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/60 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Premium tier */}
                <div className="relative rounded-xl border border-amber-500/25 bg-amber-500/[0.04] p-4 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.06] to-transparent pointer-events-none" />
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex items-center gap-2 text-sm font-semibold text-amber-300">
                      <Crown className="h-3.5 w-3.5" />
                      Premium
                    </span>
                    <span className="text-xs text-amber-400 font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                      Coming Soon
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {[
                      { icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />, text: "Private repository access via OAuth" },
                      { icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />, text: "Priority AI scanning & faster generation" },
                      { icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />, text: "Saved environment history & templates" },
                    ].map((f) => (
                      <li key={f.text} className="flex items-center gap-2.5 text-xs text-muted-foreground">
                        {f.icon}
                        {f.text}
                      </li>
                    ))}
                    {/* Mobile SSH feature — hero item */}
                    <li className="flex items-start gap-2.5 mt-3 rounded-lg bg-amber-500/[0.08] border border-amber-500/20 px-3 py-2.5">
                      <div className="flex items-center gap-1 mt-0.5 flex-shrink-0">
                        <Smartphone className="h-3.5 w-3.5 text-amber-400" />
                        <KeyRound className="h-3 w-3 text-amber-300" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-amber-300 leading-tight">Mobile Setup via SSH Key</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                          Authenticate with your SSH key directly from your phone — spin up a dev container remotely without touching a laptop.
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>

                <p className="text-center text-[11px] text-muted-foreground/50 pt-1">
                  Premium features are in active development &mdash; star the repo to stay updated.
                </p>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-all">
                <HelpCircle className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">FAQ & Docs</span>
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-[hsl(220,20%,6%)] border-white/[0.08] text-foreground">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">Documentation & FAQ</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Learn how StrixReady transforms repositories into dev environments.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1" className="border-white/[0.08]">
                    <AccordionTrigger className="hover:no-underline hover:text-emerald-400 transition-colors">
                      How does the AI detection work?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      When you submit a URL, our backend clones the repository and scans it for package manifests (like <code className="text-emerald-400/80">package.json</code>, <code className="text-emerald-400/80">requirements.txt</code>, <code className="text-emerald-400/80">go.mod</code>), existing Dockerfiles, and CI/CD configurations. It uses this data to infer the exact languages, frameworks, and services (like Postgres or Redis) your project needs.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2" className="border-white/[0.08]">
                    <AccordionTrigger className="hover:no-underline hover:text-emerald-400 transition-colors">
                      What files are actually generated?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      We generate a <code className="text-emerald-400/80">.devcontainer/devcontainer.json</code> file configured with the optimal base image and VS Code extensions for your stack. If your project requires external services (like a database), we also generate a <code className="text-emerald-400/80">docker-compose.yml</code> and link it to the devcontainer.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3" className="border-white/[0.08]">
                    <AccordionTrigger className="hover:no-underline hover:text-emerald-400 transition-colors">
                      Why do I need to select my Operating System?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      While Docker containers are Linux-based, the host OS affects how volumes are mounted, how line endings (CRLF vs LF) are handled, and how networking (like <code className="text-emerald-400/80">host.docker.internal</code>) is configured. Selecting your OS ensures the generated config works flawlessly on your specific machine.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-4" className="border-white/[0.08]">
                    <AccordionTrigger className="hover:no-underline hover:text-emerald-400 transition-colors">
                      Do I need Docker installed?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      Yes. To use the generated environments locally, you need Docker Desktop (or an alternative like OrbStack or Rancher Desktop) and VS Code with the "Dev Containers" extension installed.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-5" className="border-white/[0.08]">
                    <AccordionTrigger className="hover:no-underline hover:text-emerald-400 transition-colors">
                      Does this work with private repositories?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      Currently, the public StrixReady instance only supports public GitHub repositories. Support for private repositories via GitHub OAuth integration is on our roadmap.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </DialogContent>
          </Dialog>
          <a
            href="https://github.com/sanjayrohith/StrixReady"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-all"
          >
            <Github className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">GitHub</span>
          </a>

          {/* ── Login / User button ───────────────────────────── */}
          {user ? (
            /* logged-in: avatar + dropdown */
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/[0.06] px-2.5 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/[0.12] hover:border-emerald-500/40 transition-all"
              >
                <span className="flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-300">
                  {initials}
                </span>
                <span className="hidden sm:inline max-w-[80px] truncate">{user.name}</span>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl border border-white/[0.08] bg-[hsl(220,20%,6%)] shadow-2xl z-50 overflow-hidden animate-fade-in-up">
                  <div className="px-4 py-3 border-b border-white/[0.06]">
                    <p className="text-xs font-semibold text-foreground">{user.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">{user.email}</p>
                  </div>
                  <div className="p-1.5">
                    <button
                      disabled
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-muted-foreground cursor-not-allowed opacity-50"
                    >
                      <User className="h-3.5 w-3.5" />
                      Profile
                      <span className="ml-auto text-[10px] bg-white/[0.06] px-1.5 py-0.5 rounded-full">Soon</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/[0.08] hover:text-red-300 transition-all"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* logged-out: Login button */
            <Dialog open={loginOpen} onOpenChange={(o) => { setLoginOpen(o); if (!o) { setAuthEmail(""); setAuthPassword(""); setAuthName(""); setShowPassword(false); } }}>
              <DialogTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg border border-white/[0.10] bg-white/[0.04] px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-white/[0.08] hover:border-white/[0.16] transition-all">
                  <LogIn className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Sign in</span>
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px] bg-[hsl(220,20%,6%)] border-white/[0.08] text-foreground p-0 overflow-hidden">
                {/* dialog gradient top bar */}
                <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />
                <div className="px-6 py-6">
                  <DialogHeader className="mb-5">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                      <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <LogIn className="h-4 w-4 text-emerald-400" />
                      </span>
                      Welcome back
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground text-xs">
                      Sign in to save environments, access history &amp; unlock Premium.
                    </DialogDescription>
                  </DialogHeader>

                  {/* tab switcher */}
                  <div className="flex mb-5 rounded-lg bg-white/[0.03] border border-white/[0.06] p-1 gap-1">
                    {(["signin", "signup"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setAuthTab(t)}
                        className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${
                          authTab === t
                            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {t === "signin" ? "Sign in" : "Create account"}
                      </button>
                    ))}
                  </div>

                  {/* GitHub OAuth */}
                  <button
                    onClick={() => {
                      toast("GitHub OAuth coming soon!", { description: "Use email & password for now." });
                    }}
                    className="w-full flex items-center justify-center gap-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-all mb-4"
                  >
                    <Github className="h-4 w-4" />
                    Continue with GitHub
                  </button>

                  {/* divider */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-white/[0.06]" />
                    <span className="text-[11px] text-muted-foreground/50">or</span>
                    <div className="flex-1 h-px bg-white/[0.06]" />
                  </div>

                  {/* form */}
                  <form onSubmit={handleAuth} className="space-y-3">
                    {authTab === "signup" && (
                      <div className="relative">
                        <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                        <input
                          type="text"
                          placeholder="Display name"
                          value={authName}
                          onChange={(e) => setAuthName(e.target.value)}
                          className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg pl-9 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all"
                        />
                      </div>
                    )}
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                      <input
                        type="email"
                        placeholder="Email address"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        required
                        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg pl-9 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all"
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        required
                        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg pl-9 pr-10 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>

                    {authTab === "signin" && (
                      <div className="text-right">
                        <button type="button" onClick={() => toast("Password reset coming soon!")} className="text-[11px] text-muted-foreground/50 hover:text-emerald-400 transition-colors">
                          Forgot password?
                        </button>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={authLoading || !authEmail.trim() || !authPassword.trim()}
                      className="w-full relative overflow-hidden rounded-lg py-2.5 text-xs font-semibold text-white
                        bg-gradient-to-r from-emerald-500 to-teal-500
                        hover:shadow-[0_0_16px_rgba(16,185,129,0.35)]
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-all active:scale-[0.98]"
                    >
                      {authLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          {authTab === "signin" ? "Signing in…" : "Creating account…"}
                        </span>
                      ) : (
                        authTab === "signin" ? "Sign in" : "Create account"
                      )}
                    </button>
                  </form>

                  <p className="text-center text-[11px] text-muted-foreground/40 mt-4">
                    {authTab === "signin" ? "No account? " : "Already have one? "}
                    <button onClick={() => setAuthTab(authTab === "signin" ? "signup" : "signin")} className="text-emerald-400/70 hover:text-emerald-400 transition-colors underline-offset-2 hover:underline">
                      {authTab === "signin" ? "Create one" : "Sign in"}
                    </button>
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </nav>

      {/* ── main content ───────────────────────────────────────── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 gap-0 min-h-0">

        {status === "idle" ? (
          /* ── idle view: headline + marquee + input ──────────── */
          <>
            {/* headline */}
            <div className="text-center animate-fade-in-up flex-shrink-0">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.1] tracking-tight text-foreground mb-3">
                Dev Environments{" "}
                <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                  in Seconds
                </span>
              </h1>

              <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
                Paste a GitHub URL &mdash; get{" "}
                <code className="px-1 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-foreground font-mono text-xs">
                  devcontainer.json
                </code>{" "}
                +{" "}
                <code className="px-1 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-foreground font-mono text-xs">
                  docker-compose.yml
                </code>
              </p>
            </div>

            {/* ── marquee ──────────────────────────────────────── */}
            <div className="w-full max-w-5xl mx-auto mt-6 mb-6 flex-shrink-0 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              <p className="text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-medium mb-2">
                How it works
              </p>
              <MarqueeRow />
            </div>

            {/* ── input section ────────────────────────────────── */}
            <div className="w-full max-w-xl mx-auto flex-shrink-0 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              {/* OS selector */}
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-semibold whitespace-nowrap">
                  Select OS
                </span>
                <div className="inline-flex gap-0.5 rounded-xl bg-white/[0.03] border border-white/[0.06] p-1">
                  {osOptions.map((os) => (
                    <button
                      key={os.value}
                      onClick={() => setSelectedOS(os.value)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                        selectedOS === os.value
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                      }`}
                    >
                      {os.icon}
                      {os.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* subtitle moved here — below OS selector */}
              <p className="text-center text-sm text-muted-foreground leading-relaxed mb-5">
                Paste a GitHub URL &mdash; get{" "}
                <code className="px-1 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-foreground font-mono text-xs">
                  devcontainer.json
                </code>{" "}
                +{" "}
                <code className="px-1 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-foreground font-mono text-xs">
                  docker-compose.yml
                </code>
              </p>

              {/* input + button */}
              <div className="relative group">
                <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 opacity-20 group-hover:opacity-40 group-focus-within:opacity-100 blur-md transition-all duration-500 animate-gradient bg-[length:200%_auto]" />

                <div className="relative flex items-center w-full rounded-[2rem] bg-[hsl(220,20%,6%)] border border-white/[0.08] p-1.5 shadow-2xl transition-all duration-300 group-focus-within:border-emerald-500/50 group-focus-within:bg-[hsl(220,20%,4%)]">
                  <div className="pl-4 pr-2 text-muted-foreground/50 group-focus-within:text-emerald-400 transition-colors">
                    <Github className="h-5 w-5" />
                  </div>
                  <input
                    type="url"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRun()}
                    placeholder="https://github.com/username/repository"
                    className="flex-1 bg-transparent border-none px-2 py-3.5 text-foreground placeholder:text-muted-foreground/40 font-mono text-sm focus:outline-none focus:ring-0"
                  />
                  <div className="flex items-center gap-1.5 pr-0.5">
                    {/* Generate button */}
                    <button
                      onClick={handleGenerateOnly}
                      disabled={!repoUrl.trim() || loading}
                      className="relative overflow-hidden rounded-full px-5 py-3 font-semibold text-sm transition-all duration-300
                        disabled:opacity-50 disabled:cursor-not-allowed
                        bg-white/[0.06] border border-white/[0.1] text-foreground
                        hover:bg-white/[0.1] hover:border-white/[0.2]
                        active:scale-[0.97] group/gen"
                    >
                      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover/gen:animate-shimmer" />
                      <span className="relative flex items-center justify-center gap-2">
                        <Zap className="h-3.5 w-3.5" />
                        Generate
                      </span>
                    </button>
                    {/* Run button */}
                    <button
                      onClick={handleRun}
                      disabled={!repoUrl.trim() || loading}
                      className="relative overflow-hidden rounded-full px-5 py-3 font-semibold text-sm transition-all duration-300
                        disabled:opacity-50 disabled:cursor-not-allowed
                        bg-gradient-to-r from-emerald-500 to-teal-500 text-white
                        hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]
                        active:scale-[0.97] group/btn"
                    >
                      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover/btn:animate-shimmer" />
                      <span className="relative flex items-center justify-center gap-2">
                        <Play className="h-3.5 w-3.5" />
                        Run
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* ── scan view: condensed input + live terminal ────── */
          <>
            {/* compact repo badge */}
            <div className="flex items-center gap-3 mb-5 animate-fade-in-up">
              <div className="flex items-center gap-2 rounded-full bg-white/[0.04] border border-white/[0.08] px-4 py-2">
                <Github className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-mono text-foreground truncate max-w-[300px]">{repoUrl}</span>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold px-2 py-1 rounded bg-white/[0.04] border border-white/[0.06]">
                {selectedOS}
              </span>
            </div>

            {/* live log terminal */}
            <LogPanel logs={logs} status={status} onReset={resetScan} doneData={doneData} />
          </>
        )}
      </main>

      {/* ── footer ─────────────────────────────────────────────── */}
      <footer className="relative z-10 text-center text-[11px] text-muted-foreground/40 py-3 flex-shrink-0">
        Built by StrixReady &middot; Open Source
      </footer>
    </div>
  );
};

export default LandingPage;
