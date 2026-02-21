import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Terminal, CheckCircle2, ExternalLink, Sparkles, Code2 } from "lucide-react";
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
      <div className="min-h-screen gradient-bg flex items-center justify-center relative overflow-hidden">
        <div className="text-center animate-fade-in-up relative z-10">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur-xl opacity-50 animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-primary to-accent p-4 rounded-full">
              <Code2 className="h-12 w-12 text-white animate-pulse" />
            </div>
          </div>
          <p className="text-foreground text-lg font-semibold mb-2">Analyzing repository</p>
          <p className="text-muted-foreground text-sm font-mono mb-4 max-w-md truncate">{repoUrl}</p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const frameworkLabel =
    data.profile.framework.charAt(0).toUpperCase() + data.profile.framework.slice(1);
  const dbLabel = data.profile.db.charAt(0).toUpperCase() + data.profile.db.slice(1);

  return (
    <div className="min-h-screen gradient-bg relative overflow-hidden">
      {/* Header */}
      <nav className="flex items-center justify-between px-6 py-5 md:px-12 relative z-10">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors text-sm font-medium hover:bg-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center">
            <Sparkles className="text-black h-5 w-5" />
          </div>
          <span className="font-bold text-foreground tracking-tight text-lg">StrixReady</span>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 pb-12 relative z-10">
        {/* Detection Card */}
        <div className="rounded-xl bg-card border border-border p-6 mb-8 animate-fade-in-up">
          <div className="flex flex-wrap items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="text-sm text-muted-foreground font-medium">Successfully detected:</span>
            <span className="rounded-lg bg-secondary border border-border text-foreground px-4 py-1.5 text-sm font-semibold">
              {frameworkLabel}
            </span>
            <span className="text-muted-foreground">+</span>
            <span className="rounded-lg bg-secondary border border-border text-foreground px-4 py-1.5 text-sm font-semibold">
              {dbLabel}
            </span>
            <span className="ml-auto text-xs text-muted-foreground font-mono hidden sm:flex items-center gap-2 bg-secondary px-3 py-1 rounded-lg border border-border">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Port {data.profile.port}
            </span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content Area - Code Blocks */}
          <div className="flex-1 space-y-6">
            {/* Code Blocks */}
            <div className="grid grid-cols-1 gap-6">
              <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                <CodeBlock
                  title="Dev Container"
                  filename="devcontainer.json"
                  code={data.devcontainer}
                  language="json"
                />
              </div>
              <div className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
                <CodeBlock
                  title="Docker Compose"
                  filename="docker-compose.dev.yml"
                  code={data.compose}
                  language="yaml"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <button
                onClick={handleDownloadZip}
                className="flex-1 flex items-center justify-center gap-3 rounded-xl py-4 bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all"
              >
                <Download className="h-5 w-5" />
                Download Configuration
              </button>
              <button className="flex-1 flex items-center justify-center gap-3 rounded-xl py-4 bg-card border border-border font-semibold text-sm hover:bg-secondary transition-all">
                <Terminal className="h-5 w-5" />
                Try CLI
              </button>
            </div>
          </div>

          {/* Sidebar - Prerequisites */}
          <aside className="lg:w-80 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <div className="rounded-xl bg-card border border-border p-6 lg:sticky lg:top-4">
              <h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-foreground" />
                Prerequisites
              </h3>
              <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
                Ensure these are installed on your system:
              </p>
              
              <div className="space-y-3">
                {/* Docker */}
                <div className="p-3 rounded-lg bg-secondary border border-border hover:bg-muted transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-xs text-foreground">Docker Desktop</span>
                    <a
                      href="https://www.docker.com/products/docker-desktop/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:opacity-70 transition-all ml-auto"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                  <p className="text-xs text-muted-foreground">Container runtime</p>
                </div>

                {/* VSCode */}
                <div className="p-3 rounded-lg bg-secondary border border-border hover:bg-muted transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-xs text-foreground">VS Code</span>
                    <a
                      href="https://code.visualstudio.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:opacity-70 transition-all ml-auto"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                  <p className="text-xs text-muted-foreground">Recommended IDE</p>
                </div>

                {/* Dev Containers Extension */}
                <div className="p-3 rounded-lg bg-secondary border border-border hover:bg-muted transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-xs text-foreground">Dev Containers</span>
                    <a
                      href="https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:opacity-70 transition-all ml-auto"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                  <p className="text-xs text-muted-foreground">VSCode extension</p>
                </div>

                {/* Git */}
                <div className="p-3 rounded-lg bg-secondary border border-border hover:bg-muted transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-xs text-foreground">Git</span>
                    <a
                      href="https://git-scm.com/downloads"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:opacity-70 transition-all ml-auto"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                  <p className="text-xs text-muted-foreground">Version control</p>
                </div>
              </div>

              <div className="mt-5 p-4 rounded-lg bg-secondary border border-border">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-foreground/90 leading-relaxed">
                    <span className="font-semibold">Auto-configured:</span> All {frameworkLabel} and {dbLabel} dependencies install automatically inside the container.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <SuccessModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
};

export default ResultsPage;
