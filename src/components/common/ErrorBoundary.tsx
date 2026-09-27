import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Logged separately from the customer-facing message shown below (skill §27).
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-full flex-col items-center justify-center gap-4 px-6 py-16 text-center">
          <h1 className="text-lg font-semibold">Something went wrong.</h1>
          <p className="text-sm text-text-muted">
            Please try again. If this keeps happening, contact support.
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="rounded-pill bg-primary-500 px-6 py-2 text-sm font-medium text-white shadow-soft"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
