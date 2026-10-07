import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/pk/Icon";

export interface ProfileSubPageProps {
  kicker: string;
  title: string;
  description: string;
  children: ReactNode;
}

/** Edit profile / change password / delete account — the design's page title + card. */
export default function ProfileSubPage({ kicker, title, description, children }: ProfileSubPageProps) {
  const navigate = useNavigate();

  return (
    <main className="inner-page account-bg">
      <div className="shell page-title">
        <p className="kicker">{kicker}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="shell" style={{ maxWidth: 620, paddingBottom: 30 }}>
        <section className="checkout-card">{children}</section>
      </div>
      <button type="button" className="back-profile" onClick={() => navigate("/profile")}>
        <Icon name="arrow" /> Back to profile
      </button>
    </main>
  );
}
