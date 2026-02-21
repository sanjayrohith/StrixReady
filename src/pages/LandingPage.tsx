import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";

type OS = "windows" | "macos" | "linux";

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

const LandingPage = () => {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedOS, setSelectedOS] = useState<OS>("linux");
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const rootRef = useRef<HTMLDivElement>(null);

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

  const handleGenerate = async () => {
    if (!repoUrl.trim()) return;
    setLoading(true);

    try {
      // Send the URL to the backend
      const response = await fetch("http://localhost:8000/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: repoUrl.trim(), os: selectedOS }),
      });

      if (!response.ok) throw new Error("Failed to setup environment");

      toast.success("Environment setup initiated!", {
        description: "The backend is now cloning and configuring your environment.",
      });
      setRepoUrl("");
    } catch (error) {
      toast.error("Setup failed", {
        description: "Could not connect to the backend. Please ensure it is running.",
      });
    } finally {
      setLoading(false);
    }
  };

  const themeClass =
    selectedOS === "windows"
      ? "windows-theme"
      : selectedOS === "macos"
      ? "macos-theme"
      : "linux-theme";

  const osOptions: { value: OS; label: string; icon: string }[] = [
    { value: "windows", label: "Windows", icon: "🪟" },
    { value: "macos", label: "macOS", icon: "🍎" },
    { value: "linux", label: "Linux", icon: "🐧" },
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
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Sparkles className="text-white h-3.5 w-3.5" />
          </div>
          <span className="text-foreground text-base font-bold tracking-tight">StrixReady</span>
        </div>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-all"
        >
          <Github className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">GitHub</span>
        </a>
      </nav>

      {/* ── main content ───────────────────────────────────────── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 gap-0 min-h-0">
        {/* headline */}
        <div className="text-center animate-fade-in-up flex-shrink-0">
          <div className="inline-flex items-center gap-2 mb-4 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-[11px] font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Open Source &middot; AI Powered
          </div>

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

        {/* ── marquee ──────────────────────────────────────────── */}
        <div className="w-full max-w-5xl mx-auto mt-6 mb-6 flex-shrink-0 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <p className="text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-medium mb-2">
            How it works
          </p>
          <MarqueeRow />
        </div>

        {/* ── input section ────────────────────────────────────── */}
        <div className="w-full max-w-xl mx-auto flex-shrink-0 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          {/* OS selector */}
          <div className="flex justify-center mb-4">
            <div className="inline-flex gap-0.5 rounded-xl bg-white/[0.03] border border-white/[0.06] p-1">
              {osOptions.map((os) => (
                <button
                  key={os.value}
                  onClick={() => setSelectedOS(os.value)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    selectedOS === os.value
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                  }`}
                >
                  <span className="mr-1">{os.icon}</span>
                  {os.label}
                </button>
              ))}
            </div>
          </div>

          {/* input + button */}
          <div className="relative group">
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-emerald-500/20 via-transparent to-cyan-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-sm" />
            <input
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              placeholder="https://github.com/username/repository"
              className="relative w-full rounded-2xl bg-[hsl(220,18%,7%)] border border-white/[0.08] px-5 py-3.5 text-foreground placeholder:text-muted-foreground/40 font-mono text-sm focus:outline-none focus:border-emerald-500/40 transition-all"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={!repoUrl.trim() || loading}
            className="mt-3 w-full rounded-2xl py-3.5 font-semibold text-sm transition-all duration-200
              disabled:opacity-30 disabled:cursor-not-allowed
              bg-gradient-to-r from-emerald-500 to-teal-500 text-white
              hover:from-emerald-400 hover:to-teal-400
              active:scale-[0.98]
              animate-glow-pulse"
          >
            <span className="flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analyzing…
                </>
              ) : (
                <>
                  Generate Dev Environment
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </span>
          </button>
        </div>
      </main>

      {/* ── footer ─────────────────────────────────────────────── */}
      <footer className="relative z-10 text-center text-[11px] text-muted-foreground/40 py-3 flex-shrink-0">
        Built by StrixReady &middot; Open Source
      </footer>
    </div>
  );
};

export default LandingPage;
