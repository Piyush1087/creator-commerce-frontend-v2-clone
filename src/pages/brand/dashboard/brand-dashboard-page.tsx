import { AppShell } from "../../../layouts/app-shell/AppShell";
import { Card, Button, Badge } from "../../../design-system/aurora";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Clock,
  ArrowUpRight
} from "lucide-react";

export function BrandDashboardPage() {
  return (
    <AppShell>
      <div className="dashboard-content">
        {/* Hero Section - Ported from Stitch */}
        <section style={{ 
          position: "relative",
          height: 180,
          width: "100%",
          backgroundColor: "var(--color-secondary)",
          borderRadius: 16,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 32px",
          marginBottom: 32,
          border: "1px solid rgba(255, 255, 255, 0.1)"
        }}>
          {/* Abstract background elements */}
          <div style={{ 
            position: "absolute",
            right: -80,
            top: -80,
            width: 256,
            height: 256,
            borderRadius: "50%",
            background: "rgba(52, 211, 153, 0.15)",
            filter: "blur(80px)"
          }} />
          
          <h1 style={{ 
            position: "relative",
            zIndex: 1,
            color: "white",
            fontSize: 28,
            fontWeight: 600,
            margin: 0,
            fontFamily: "var(--font-heading)"
          }}>
            Welcome back, Creator.
          </h1>
          <p style={{ 
            position: "relative",
            zIndex: 1,
            color: "rgba(255, 255, 255, 0.7)",
            marginTop: 8,
            fontSize: 14
          }}>
            You have 4 campaign deadlines approaching this week.
          </p>
        </section>

        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
          gap: 24,
          marginBottom: 32 
        }}>
          <Card compact>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 600 }}>TOTAL EARNINGS</span>
              <DollarSign size={16} color="var(--color-primary)" />
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 8, color: "var(--text-high)" }}>$12,450.00</div>
            <div style={{ display: "flex" }}>
              <Badge tone="success">+12.5% this month</Badge>
            </div>
          </Card>

          <Card compact>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 600 }}>ACTIVE CAMPAIGNS</span>
              <TrendingUp size={16} color="var(--color-primary)" />
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 8, color: "var(--text-high)" }}>8</div>
            <div style={{ display: "flex" }}>
              <Badge tone="pending">3 ending this week</Badge>
            </div>
          </Card>

          <Card compact>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 600 }}>TOTAL CREATORS</span>
              <Users size={16} color="var(--color-primary)" />
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 8, color: "var(--text-high)" }}>142</div>
            <div style={{ display: "flex" }}>
              <Badge tone="success">+5 new this week</Badge>
            </div>
          </Card>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
          <Card title="Recent Activities" action={<Button variant="ghost" style={{ fontSize: 12 }}>View all</Button>}>
            <div style={{ display: "grid", gap: 16 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between",
                  paddingBottom: 16,
                  borderBottom: i < 3 ? "1px solid var(--border-default)" : "none"
                }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ 
                      width: 40, 
                      height: 40, 
                      borderRadius: 10, 
                      background: "var(--disabled-bg)",
                      display: "grid",
                      placeItems: "center"
                    }}>
                      <Clock size={18} color="var(--text-muted)" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>Campaign "Summer Vibes" updated</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>2 hours ago</div>
                    </div>
                  </div>
                  <ArrowUpRight size={16} color="var(--text-muted)" />
                </div>
              ))}
            </div>
          </Card>

          <div style={{ background: "var(--color-secondary)", borderRadius: 16, padding: 24, color: "white" }}>
            <h2 style={{ color: "white", marginBottom: 16, fontSize: 20, fontFamily: "var(--font-heading)", fontWeight: 600 }}>Quick Actions</h2>
            <div style={{ display: "grid", gap: 12 }}>
              <Button style={{ width: "100%", justifyContent: "flex-start", background: "rgba(255,255,255,0.08)", color: "white", border: "none" }}>
                Create New Campaign
              </Button>
              <Button style={{ width: "100%", justifyContent: "flex-start", background: "rgba(255,255,255,0.08)", color: "white", border: "none" }}>
                Invite Creators
              </Button>
              <Button style={{ width: "100%", justifyContent: "flex-start", background: "var(--color-primary)", color: "black", border: "none" }}>
                Upgrade Plan
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
