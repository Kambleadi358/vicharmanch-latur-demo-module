import { Link } from "react-router-dom";
import {
  COPYRIGHT_LINE,
  DEVELOPER_LINE,
  RIGHTS_LINE,
  APP_VERSION,
} from "@/lib/attribution";

interface AttributionBarProps {
  /** Use muted styling for light admin surfaces */
  variant?: "light" | "onPrimary";
  className?: string;
}

const AttributionBar = ({ variant = "light", className = "" }: AttributionBarProps) => {
  const base =
    variant === "onPrimary"
      ? "text-primary-foreground/60"
      : "text-muted-foreground";

  return (
    <div
      className={`w-full text-center text-[11px] leading-relaxed ${base} ${className}`}
    >
      <p>{COPYRIGHT_LINE}</p>
      <p>
        {DEVELOPER_LINE} {RIGHTS_LINE}
      </p>
      <p className="mt-1">
        <Link to="/legal" className="underline underline-offset-2 hover:text-accent">
          About / Legal
        </Link>
        <span className="mx-2">·</span>
        <span>v{APP_VERSION}</span>
      </p>
    </div>
  );
};

export default AttributionBar;
