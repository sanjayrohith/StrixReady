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
  HelpCircle,
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
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg overflow-hidden shadow-lg shadow-emerald-500/20">
            <img
              src="/logo.png"
              alt="Strix logo"
              className="h-full w-full object-contain"
            />
          </div>
          <span className="text-foreground text-base font-bold tracking-tight">StrixReady</span>
        </div>
        <div className="flex items-center gap-3">
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
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-all"
          >
            <Github className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </nav>

      {/* ── main content ───────────────────────────────────────── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 gap-0 min-h-0">
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
