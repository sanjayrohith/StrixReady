import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Zap, Package, Github, ArrowRight } from "lucide-react";

type OS = "windows" | "macos" | "linux";

const LandingPage = () => {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedOS, setSelectedOS] = useState<OS>("linux");
  const navigate = useNavigate();

  // Auto-detect OS on mount
  useEffect(() => {
    const detectOS = (): OS => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      if (userAgent.includes("win")) return "windows";
      if (userAgent.includes("mac")) return "macos";
      return "linux";
    };
    setSelectedOS(detectOS());
  }, []);

  const handleGenerate = async () => {
    if (!repoUrl.trim()) return;
    setLoading(true);
    // Pass the URL and OS to results page via state
    navigate("/results", { state: { repoUrl: repoUrl.trim(), os: selectedOS } });
  };

  // Theme classes based on OS
  const getThemeClasses = () => {
    switch (selectedOS) {
      case "windows":
        return "windows-theme";
      case "macos":
        return "macos-theme";
      case "linux":
        return "linux-theme";
      default:
        return "";
    }
  };

  const osOptions = [
    { value: "windows" as OS, label: "Windows", icon: "🪟" },
    { value: "macos" as OS, label: "macOS", icon: "🍎" },
    { value: "linux" as OS, label: "Linux", icon: "🐧" },
  ];

  return (
    <div className={`min-h-screen gradient-bg flex flex-col ${getThemeClasses()} relative overflow-hidden`}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 md:px-12 relative z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center">
            <Sparkles className="text-black h-5 w-5" />
          </div>
          <span className="font-bebas text-foreground text-2xl">StrixReady</span>
        </div>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors text-sm font-medium hover:bg-secondary"
        >
          <Github className="h-4 w-4" />
          <span className="hidden sm:inline">GitHub</span>
        </a>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-20 relative z-10">
        <div className="text-center max-w-4xl mx-auto animate-fade-in-up">

          <h1 className="text-6xl md:text-8xl font-bebas mb-6 leading-tight text-foreground">
            StrixReady
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-4 leading-relaxed">
            Transform any GitHub repository into a{" "}
            <span className="text-foreground font-semibold">
              production-ready
            </span>{" "}
            dev environment
          </p>

          <p className="text-base text-muted-foreground max-w-xl mx-auto mb-12">
            Get <code className="px-2 py-1 rounded bg-card border border-border text-foreground font-mono text-sm">devcontainer.json</code> +{" "}
            <code className="px-2 py-1 rounded bg-card border border-border text-foreground font-mono text-sm">docker-compose.yml</code> in seconds
          </p>

          {/* OS Selector */}
          <div className="mb-8 flex flex-col items-center gap-4">
            <span className="text-sm text-muted-foreground font-medium">Select your operating system</span>
            <div className="flex gap-2 rounded-xl bg-card border border-border p-1.5">
              {osOptions.map((os) => (
                <button
                  key={os.value}
                  onClick={() => setSelectedOS(os.value)}
                  className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all ${
                    selectedOS === os.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <span className="mr-2 text-lg">{os.icon}</span>
                  {os.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="w-full max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                placeholder="https://github.com/username/repository"
                className="w-full rounded-xl bg-card border border-border px-6 py-4 text-foreground placeholder:text-muted-foreground font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={!repoUrl.trim() || loading}
              className="mt-5 w-full rounded-xl py-4 font-semibold text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]"
            >
              <span className="flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Analyzing repository...
                  </>
                ) : (
                  <>
                    Generate Dev Environment
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </span>
            </button>
          </div>

          {/* Features */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { 
                icon: <Zap className="h-6 w-6" />, 
                title: "Lightning Fast", 
                desc: "AI-powered detection in milliseconds"
              },
              { 
                icon: <Package className="h-6 w-6" />, 
                title: "Docker Ready", 
                desc: "Complete environment configuration"
              },
              { 
                icon: <Sparkles className="h-6 w-6" />, 
                title: "One-Click Setup", 
                desc: "Download and start coding instantly"
              },
            ].map((f, i) => (
              <div
                key={f.title}
                className="rounded-xl bg-card border border-border p-6 text-center hover:bg-secondary transition-colors"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="inline-flex p-3 rounded-lg bg-secondary text-foreground mb-4">
                  {f.icon}
                </div>
                <div className="text-base font-semibold text-foreground mb-2">{f.title}</div>
                <div className="text-sm text-muted-foreground leading-relaxed">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-sm text-muted-foreground py-8 relative z-10">
        <div className="inline-flex items-center gap-2">
          <span>Built by StrixReady Team</span>
          <span className="mx-2">·</span>
          <a href="#" className="hover:text-foreground transition-colors">Open Source</a>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
