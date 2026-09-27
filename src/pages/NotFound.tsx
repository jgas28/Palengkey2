import { Link } from "react-router-dom";
import { SearchX } from "lucide-react";
import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-primary">
        <SearchX size={30} aria-hidden="true" />
      </span>
      <div>
        <h1 className="font-display text-2xl font-bold text-text">Page not found</h1>
        <p className="mt-1 text-sm text-text-muted">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Link to="/shop">
          <Button variant="solid">Back to Shop</Button>
        </Link>
        <Link to="/">
          <Button variant="ghost">Go Home</Button>
        </Link>
      </div>
    </div>
  );
}
