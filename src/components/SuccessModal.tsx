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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/90 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative rounded-xl bg-card border border-border p-10 max-w-md w-full shadow-2xl animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center mb-8">
          <div className="inline-block mb-4 bg-green-500 rounded-full p-4">
            <CheckCircle className="h-12 w-12 text-white" strokeWidth={2.5} />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Ready to Go!
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Your dev environment configuration has been successfully downloaded.
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-border"></div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Next Steps
            </span>
            <div className="h-px flex-1 bg-border"></div>
          </div>
          
          {steps.map((step) => (
            <div
              key={step.num}
              className="flex items-start gap-4 rounded-lg bg-secondary p-4 border border-border hover:bg-muted transition-colors"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-background text-sm font-bold">
                {step.num}
              </div>
              <span className="text-sm text-foreground leading-relaxed font-medium pt-1">
                {step.text}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-lg py-4 bg-primary text-background font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          Got it, let's code!
        </button>
      </div>
    </div>
  );
};

export default SuccessModal;
