import * as React from "react";
import { AlertTriangle } from "lucide-react";

interface State {
  error: Error | null;
}

/** Last-resort boundary so a rendering bug in one screen never blanks the whole app. */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[CQA] render error", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-critical/10 text-critical">
            <AlertTriangle className="size-6" />
          </div>
          <div className="font-display text-h3">Something went wrong</div>
          <pre className="max-w-xl whitespace-pre-wrap rounded-md bg-surface-2 px-4 py-3 text-left font-mono text-[12px] text-text-2">{this.state.error.message}</pre>
          <button type="button" className="h-10 rounded-full border-[1.5px] border-line-strong px-[18px] text-caption font-medium hover:bg-text/[0.04]" onClick={() => this.setState({ error: null })}>
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
