import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Terminal } from "lucide-react";
import CodeBlock from "@/components/CodeBlock";
import SuccessModal from "@/components/SuccessModal";
import { generateFromUrl, MOCK_RESPONSE } from "@/lib/api";

const ResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const repoUrl = (location.state as any)?.repoUrl || "";

  const [data, setData] = useState<typeof MOCK_RESPONSE | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!repoUrl) {
      navigate("/");
      return;
    }
    generateFromUrl(repoUrl).then((res) => {
      setData(res);
      setLoading(false);
    });
  }, [repoUrl, navigate]);

  const handleDownloadZip = () => {
    // Simulate ZIP download
    if (!data) return;
    const devcontainerBlob = new Blob([data.devcontainer], { type: "application/json" });
    const composeBlob = new Blob([data.compose], { type: "text/yaml" });

    // Download both files individually (real app would ZIP)
    [
      { blob: devcontainerBlob, name: "devcontainer.json" },
      { blob: composeBlob, name: "docker-compose.dev.yml" },
    ].forEach(({ blob, name }) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    });

    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center animate-fade-in-up">
          <svg className="animate-spin h-10 w-10 text-primary mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-muted-foreground text-sm">Analyzing repository…</p>
          <p className="text-muted-foreground/60 text-xs mt-1 font-mono">{repoUrl}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const frameworkLabel =
    data.profile.framework.charAt(0).toUpperCase() + data.profile.framework.slice(1);
  const dbLabel = data.profile.db.charAt(0).toUpperCase() + data.profile.db.slice(1);

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <nav className="flex items-center justify-between px-6 py-4 md:px-12">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <span className="text-primary font-bold font-mono text-sm">S</span>
          </div>
          <span className="font-semibold text-foreground tracking-tight">StrixReady</span>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 pb-12">
        {/* Detection Card */}
        <div className="rounded-xl border border-border bg-card p-5 mb-8 animate-fade-in-up">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">Detected:</span>
            <span className="rounded-lg bg-primary/15 text-primary px-3 py-1 text-sm font-semibold">
              {frameworkLabel}
            </span>
            <span className="text-muted-foreground">+</span>
            <span className="rounded-lg bg-accent/15 text-accent px-3 py-1 text-sm font-semibold">
              {dbLabel}
            </span>
            <span className="ml-auto text-xs text-muted-foreground font-mono hidden sm:block">
              Port {data.profile.port}
            </span>
          </div>
        </div>

        {/* Code Blocks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8" style={{ animationDelay: "0.1s" }}>
          <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <CodeBlock
              title="Dev Container"
              filename="devcontainer.json"
              code={data.devcontainer}
              language="json"
            />
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <CodeBlock
              title="Docker Compose"
              filename="docker-compose.dev.yml"
              code={data.compose}
              language="yaml"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          <button
            onClick={handleDownloadZip}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3.5 bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 transition-all glow-shadow"
          >
            <Download className="h-4 w-4" />
            Download ZIP
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3.5 border border-border bg-secondary text-secondary-foreground font-semibold text-sm hover:bg-secondary/80 transition-all">
            <Terminal className="h-4 w-4" />
            Try CLI
          </button>
        </div>
      </main>

      <SuccessModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
};

export default ResultsPage;
