import { Component, type ErrorInfo, type ReactNode } from "react";
import ErrorPage from "@/pages/system/ErrorPage";
import { makeErrorReference } from "@/features/system/errorReference";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  reference?: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true, reference: makeErrorReference(500) };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Logged separately from the customer-facing message shown below (skill §27).
    // The reference matches what the customer sees, so a report can be traced here.
    console.error(
      `Unhandled UI error [${this.state.reference ?? "?"}]:`,
      error,
      info.componentStack,
    );
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return <ErrorPage reference={this.state.reference} onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}
