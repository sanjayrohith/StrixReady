import { CheckCircle, X } from "lucide-react";

interface SuccessModalProps {
  open: boolean;
  onClose: () => void;
}

const SuccessModal = ({ open, onClose }: SuccessModalProps) => {
  if (!open) return null;

  const steps = [
    { num: 1, text: "Add the generated files to your repo" },
    { num: 2, text: "Run docker compose up" },
    { num: 3, text: "Open VS Code → Reopen in Container" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative rounded-2xl border border-border bg-card p-8 max-w-md w-full mx-4 shadow-2xl animate-fade-in-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center mb-6">
          <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground">Ready to use!</h2>
          <p className="text-muted-foreground text-sm mt-2">
            Your dev environment files have been downloaded.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Next Steps
          </h3>
          {steps.map((step) => (
            <div
              key={step.num}
              className="flex items-start gap-3 rounded-lg border border-border bg-secondary/30 p-3"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
                {step.num}
              </span>
              <span className="text-sm text-foreground leading-relaxed font-mono">
                {step.text}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-xl py-3 bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 transition-all"
        >
          Got it!
        </button>
      </div>
    </div>
  );
};

export default SuccessModal;
