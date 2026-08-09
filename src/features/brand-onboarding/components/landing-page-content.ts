import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Brain,
  Calendar,
  DollarSign,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserSearch,
  Users,
  Zap,
} from "lucide-react";

export const LANDING_TRUST_ITEMS = [
  { label: "Meta-Verified Partnership", icon: "verified" as const },
  { label: "256-bit AES Encryption", icon: "lock" as const },
  { label: "SOC2 Type II", icon: "shield" as const },
  { label: "GDPR & CCPA Compliant", icon: "policy" as const },
] as const;

export const LANDING_TRINITY_PILLARS: ReadonlyArray<{
  title: string;
  body: string;
  Icon: LucideIcon;
  tone: "primary" | "tertiary" | "secondary";
}> = [
  {
    title: "Understand Your Brand",
    body: "Deep Brand Resonance Scan: We spend time understanding your tone, your audience's needs, and your competitive landscape so we can speak your language.",
    Icon: Brain,
    tone: "primary",
  },
  {
    title: "Find Your People",
    body: "Thoughtful Matching: Our AI looks beyond follower counts to find creators whose archetypes, values, and visual quality align perfectly with your budget.",
    Icon: Users,
    tone: "tertiary",
  },
  {
    title: "Stay in Sync",
    body: "Nurturing Relationship: Manage your entire journey through an intuitive, human-centric chat interface. No more cold emails; just real conversations.",
    Icon: RefreshCw,
    tone: "secondary",
  },
];

export const LANDING_CAPABILITIES: ReadonlyArray<{
  title: string;
  body: string;
  Icon: LucideIcon;
}> = [
  {
    title: "Instant Brand Profile",
    body: "We do the heavy lifting by building your profile from your URL.",
    Icon: Sparkles,
  },
  {
    title: "Campaign Planner",
    body: "Effortlessly map out seasonal stories with AI-guided strategy.",
    Icon: Calendar,
  },
  {
    title: "Creator Deep-Dive",
    body: "Get the full picture of a partner's impact before you reach out.",
    Icon: UserSearch,
  },
  {
    title: "Growth-Ready Plans",
    body: "Flexible options that grow alongside your brand's success.",
    Icon: TrendingUp,
  },
  {
    title: "Direct Relationships",
    body: "Skip the inbox clutter with a faster, more personal chat UI.",
    Icon: MessageSquare,
  },
  {
    title: "Insightful Intelligence",
    body: "Stay informed on industry trends to keep your strategy fresh.",
    Icon: Zap,
  },
  {
    title: "Performance Reports",
    body: "Clear, actionable data to help you celebrate your ROI.",
    Icon: BarChart3,
  },
  {
    title: "Fair Market Access",
    body: "Save up to 40% by connecting directly with talent who fit your budget.",
    Icon: DollarSign,
  },
  {
    title: "Secure Escrow",
    body: "Your investment is protected until every deliverable is met.",
    Icon: ShieldCheck,
  },
];

export const LANDING_SECURITY_FEATURES = [
  {
    title: "Respectful Access",
    body: "Meta Graph API (v25.0) for secure, read-only/send-only permissions.",
  },
  {
    title: "Protective Limits",
    body: "Strict adherence to Meta's safety guidelines to ensure account health.",
  },
  {
    title: "Total Privacy",
    body: "We never see your passwords. Everything is handled via secure, encrypted handshake.",
  },
] as const;

export const LANDING_SECURITY_MANIFEST = [
  "> Initializing Meta Graph Handshake...",
  "> Requesting Read-Only Permissions (v25.0)",
  "> Encryption Key: AES-256-GCM Verified",
  "> SOC2 Compliance Check: PASS",
  "> User ID: **********",
  "> Connection Established. Security Handshake Complete.",
] as const;
