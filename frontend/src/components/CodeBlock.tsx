import { useState } from "react";
import { Copy, Check, Download, FileCode } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";

interface CodeBlockProps {
  title: string;
  filename: string;
  code: string;
  language: string;
}

const CodeBlock = ({ title, filename, code, language }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-secondary">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <FileCode className="h-4 w-4 text-background" />
          </div>
          <div>
            <span className="text-sm font-semibold text-foreground block">{title}</span>
            <span className="text-xs font-mono text-muted-foreground">
              {filename}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            <span className="hidden sm:inline">{copied ? "Copied!" : "Copy"}</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Save</span>
          </button>
        </div>
      </div>

      {/* Code */}
      <div className="overflow-auto flex-1 max-h-[500px]">
        <SyntaxHighlighter
          language={language}
          style={dracula}
          customStyle={{
            margin: 0,
            borderRadius: 0,
            background: "transparent",
            fontSize: "0.825rem",
            padding: "1.5rem",
          }}
          showLineNumbers
          lineNumberStyle={{ 
            color: "hsl(215, 20%, 40%)", 
            minWidth: "3em",
            paddingRight: "1em",
            userSelect: "none"
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export default CodeBlock;
