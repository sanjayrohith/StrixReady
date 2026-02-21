import { useState } from "react";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGenerate = async () => {
    if (!repoUrl.trim()) return;
    setLoading(true);
    // Pass the URL to results page via state
    navigate("/results", { state: { repoUrl: repoUrl.trim() } });
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 md:px-12">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <span className="text-primary font-bold font-mono text-sm">S</span>
          </div>
          <span className="font-semibold text-foreground tracking-tight">StrixReady</span>
        </div>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          GitHub
        </a>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-20">
        <div className="text-center max-w-3xl mx-auto animate-fade-in-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-xs text-muted-foreground mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Open source dev environment generator
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 gradient-text leading-tight">
            StrixReady
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-12 leading-relaxed">
            Paste a GitHub repo → Get{" "}
            <span className="text-foreground font-medium">devcontainer.json</span> +{" "}
            <span className="text-foreground font-medium">docker-compose.yml</span> in
            seconds.
          </p>

          {/* Input */}
          <div className="w-full max-w-xl mx-auto">
            <div className="relative gradient-border rounded-xl">
              <input
                type="url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                placeholder="https://github.com/user/repo"
                className="w-full rounded-xl bg-card px-5 py-4 text-foreground placeholder:text-muted-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={!repoUrl.trim() || loading}
              className="mt-4 w-full rounded-xl py-4 font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-primary text-primary-foreground hover:brightness-110 glow-shadow animate-pulse-glow"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analyzing repository…
                </span>
              ) : (
                "Generate Dev Environment"
              )}
            </button>
          </div>

          {/* Features */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              { icon: "⚡", title: "Instant", desc: "Auto-detect stack in seconds" },
              { icon: "🐳", title: "Docker Ready", desc: "devcontainer + compose files" },
              { icon: "📦", title: "Download & Go", desc: "ZIP or CLI install" },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-card/50 p-4 text-center"
              >
                <div className="text-2xl mb-2">{f.icon}</div>
                <div className="text-sm font-medium text-foreground">{f.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-muted-foreground py-6">
        Built with StrixReady · Open Source
      </footer>
    </div>
  );
};

export default LandingPage;
