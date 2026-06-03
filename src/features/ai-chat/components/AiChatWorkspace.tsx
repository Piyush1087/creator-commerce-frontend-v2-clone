import { useState, type FormEvent, type KeyboardEvent } from "react";

import type {
  AiChatMessage,
  AiChatThreadStub,
  CampaignSlotData,
  ChatScopeContext,
  SlotStep,
} from "../types";
import "./AiChatWorkspace.css";

const INITIAL_MESSAGES: AiChatMessage[] = [
  {
    id: "m1",
    sender: "SYSTEM",
    text: "Welcome back, Brand Admin. Campaign operations, creator profiles, and multi-tenant escrow pipelines are initialized. How can I assist your marketing operations today?",
  },
];

const RECENT_THREADS: AiChatThreadStub[] = [
  { id: "t1", title: "Retinol Serum Setup", timestamp: "2h ago" },
  { id: "t2", title: "Q2 Escrow Disbursal Audit", timestamp: "Yesterday" },
  { id: "t3", title: "@sarah_creations Hold Release", timestamp: "3 days ago" },
];

const ROUTING_SCOPES: ChatScopeContext[] = ["BRAND_CENTRE", "ANALYTICS", "ESCROW"];

/**
 * Prototype intake — mock chat, Aurora tokens via CSS variables.
 * App shell provides sidebar/header.
 */
export function AiChatWorkspace() {
  const [activeScope, setActiveScope] = useState<ChatScopeContext>("GLOBAL");
  const [inputValue, setInputValue] = useState("");
  const [expandedCardId, setExpandedCardId] = useState("chat-card");
  const [slotStep, setSlotStep] = useState<SlotStep>("IDLE");
  const [campaignData, setCampaignData] = useState<CampaignSlotData>({
    product: "",
    budget: "",
    objective: "",
  });
  const [messages, setMessages] = useState<AiChatMessage[]>(INITIAL_MESSAGES);

  const executePrompt = (textToSubmit: string) => {
    if (!textToSubmit.trim()) return;

    const userMsg: AiChatMessage = {
      id: `u-${Date.now()}`,
      sender: "USER",
      text: textToSubmit,
    };

    setMessages((prev) => [...prev, userMsg]);

    if (textToSubmit.toLowerCase().includes("launch a campaign for retinol serum")) {
      setCampaignData((prev) => ({ ...prev, product: "Retinol Serum" }));
      setSlotStep("AWAITING_BUDGET");

      window.setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `s-${Date.now()}`,
            sender: "SYSTEM",
            text: "I will prepare that campaign roadmap for your Retinol Serum. To complete the blueprint, please define your target budget allocation and primary marketing performance objective below:",
            isSlotFillingForm: true,
          },
        ]);
      }, 600);
    } else {
      window.setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `s-${Date.now()}`,
            sender: "SYSTEM",
            text: `Processed intent context safely under scoped parameters [${activeScope}]. System states are clear.`,
          },
        ]);
      }, 600);
    }
    setInputValue("");
  };

  const handleFormSubmitSlot = (e: FormEvent) => {
    e.preventDefault();
    setSlotStep("IDLE");

    const operationalConfirmation: AiChatMessage = {
      id: `u-slot-${Date.now()}`,
      sender: "USER",
      text: `Budget Allocated: INR ${Number(campaignData.budget).toLocaleString("en-IN")} | Primary Objective Track: ${campaignData.objective}`,
    };

    setMessages((prev) => [...prev, operationalConfirmation]);

    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `s-confirm-${Date.now()}`,
          sender: "SYSTEM",
          text: `Successfully initialized campaign framework draft for "Retinol Serum" inside Tab 3 (Campaign Planner). Budget set to INR ${Number(campaignData.budget).toLocaleString("en-IN")} with optimization focus locked to ${campaignData.objective}.`,
        },
      ]);
    }, 600);
  };

  const selectSuggestedPrompt = (promptText: string, targetScope: ChatScopeContext) => {
    setActiveScope(targetScope);
    setInputValue(promptText);
  };

  const handleComposerKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") executePrompt(inputValue);
  };

  return (
    <div className="ai-chat-workspace">
      <div className="ai-chat-workspace__inner">
        <div
          role="button"
          tabIndex={0}
          className={`ai-chat-card ${expandedCardId === "welcome-card" ? "ai-chat-card--expanded" : ""}`}
          onClick={() => setExpandedCardId("welcome-card")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setExpandedCardId("welcome-card");
          }}
        >
          <h1 className="ai-chat-card__title">Welcome back, Brand.</h1>
          {expandedCardId === "welcome-card" ? (
            <p className="ai-chat-card__body">
              Your marketing campaigns are performing efficiently. You have 3 pending
              milestone approvals waiting inside the collaboration pipelines. Use the
              system agent console below to initiate updates instantly.
            </p>
          ) : (
            <span className="ai-chat-card__hint">Click to view details</span>
          )}
        </div>

        <div className="ai-chat-stats">
          <div className="ai-chat-card ai-chat-card--workflow ai-chat-stat">
            <div className="ai-chat-stat__row">
              <div className="ai-chat-stat__meta">
                <span className="ai-chat-stat__label">Total Wallet Spend</span>
                <div className="ai-chat-stat__value">$12,450.00</div>
              </div>
              <span className="ai-chat-stat__icon--primary" aria-hidden>
                📈
              </span>
            </div>
          </div>

          <div className="ai-chat-card ai-chat-stat">
            <div className="ai-chat-stat__row">
              <div className="ai-chat-stat__meta">
                <span className="ai-chat-stat__label">Active Pipelines</span>
                <div className="ai-chat-stat__value">14</div>
              </div>
              <span className="ai-chat-stat__icon--tertiary" aria-hidden>
                ⭐
              </span>
            </div>
          </div>
        </div>

        <div
          role="button"
          tabIndex={0}
          className={`ai-chat-console ${expandedCardId === "chat-card" ? "ai-chat-console--expanded" : ""}`}
          onClick={() => setExpandedCardId("chat-card")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setExpandedCardId("chat-card");
          }}
        >
          <div className="ai-chat-console__head">
            <div>
              <h2 className="ai-chat-console__title">AI Co-Pilot Workspace Console</h2>
              <span className="ai-chat-console__scope">
                System Scope Anchor:{" "}
                <span className="ai-chat-console__scope-value">{activeScope}</span>
              </span>
            </div>
            <span className="ai-chat-console__badge">Secure Sandbox Engine v4.1</span>
          </div>

          <div className="ai-chat-feed" onClick={(e) => e.stopPropagation()}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`ai-chat-msg-row ai-chat-msg-row--${msg.sender === "USER" ? "user" : "system"}`}
              >
                <div
                  className={`ai-chat-msg ai-chat-msg--${msg.sender === "USER" ? "user" : "system"}`}
                >
                  {msg.text}

                  {msg.isSlotFillingForm && slotStep === "AWAITING_BUDGET" ? (
                    <form className="ai-chat-slot-form" onSubmit={handleFormSubmitSlot}>
                      <div className="ai-chat-slot-form__field">
                        <label className="ai-chat-slot-form__label" htmlFor="ai-chat-budget">
                          Target Allocation Cap (INR)
                        </label>
                        <input
                          id="ai-chat-budget"
                          className="ai-chat-slot-form__input"
                          type="number"
                          required
                          placeholder="e.g. 75000"
                          value={campaignData.budget}
                          onChange={(e) =>
                            setCampaignData((prev) => ({
                              ...prev,
                              budget: e.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="ai-chat-slot-form__field">
                        <label className="ai-chat-slot-form__label" htmlFor="ai-chat-objective">
                          Primary Performance Optimization Target Focus Track
                        </label>
                        <select
                          id="ai-chat-objective"
                          className="ai-chat-slot-form__select"
                          required
                          value={campaignData.objective}
                          onChange={(e) =>
                            setCampaignData((prev) => ({
                              ...prev,
                              objective: e.target.value,
                            }))
                          }
                        >
                          <option value="">-- Choose Objective Target Option --</option>
                          <option value="DIRECT_CONVERSIONS">
                            Direct Conversions Pipeline
                          </option>
                          <option value="CREATIVE_HOOK_STREAKS">
                            Creative Hook Optimization
                          </option>
                          <option value="FUNNEL_LEAK_REPAIR">
                            Funnel Drop-off Mitigation
                          </option>
                        </select>
                      </div>

                      <button type="submit" className="ai-chat-slot-form__submit">
                        Confirm Parameters & Proceed
                      </button>
                    </form>
                  ) : null}
                </div>

                {msg.sender === "SYSTEM" && !msg.isSlotFillingForm ? (
                  <div className="ai-chat-msg__feedback">
                    <button
                      type="button"
                      className="ai-chat-msg__feedback-btn"
                      aria-label="Thumbs Up"
                    >
                      👍
                    </button>
                    <button
                      type="button"
                      className="ai-chat-msg__feedback-btn"
                      aria-label="Thumbs Down"
                    >
                      👎
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div className="ai-chat-prompts" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="ai-chat-prompts__btn"
              onClick={() =>
                selectSuggestedPrompt("Launch a campaign for retinol serum", "BRAND_CENTRE")
              }
            >
              ⚡ Launch Retinol Campaign
            </button>
            <button
              type="button"
              className="ai-chat-prompts__btn"
              onClick={() =>
                selectSuggestedPrompt(
                  "Show me an audit ledger statement of all statutory TDS buffer funds",
                  "ESCROW",
                )
              }
            >
              ⚡ Audit TDS Tax Reserves
            </button>
          </div>

          <div className="ai-chat-composer" onClick={(e) => e.stopPropagation()}>
            <span className="ai-chat-composer__scope">{activeScope}</span>
            <input
              type="text"
              className="ai-chat-composer__input"
              placeholder="Submit your operational intent request..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleComposerKeyDown}
            />
            <button
              type="button"
              className="ai-chat-composer__run"
              onClick={() => executePrompt(inputValue)}
            >
              Run
            </button>
          </div>

          <div className="ai-chat-routing" onClick={(e) => e.stopPropagation()}>
            <span className="ai-chat-routing__label">Direct Context Routing Deck:</span>
            <div className="ai-chat-routing__deck">
              {ROUTING_SCOPES.map((scope) => (
                <button
                  key={scope}
                  type="button"
                  className={`ai-chat-routing__btn ${activeScope === scope ? "ai-chat-routing__btn--active" : ""}`}
                  onClick={() => setActiveScope(activeScope === scope ? "GLOBAL" : scope)}
                >
                  {scope === "BRAND_CENTRE" && "🎨 Brand Strategy"}
                  {scope === "ANALYTICS" && "📊 Funnel Analytics"}
                  {scope === "ESCROW" && "🪙 Escrow Node"}
                </button>
              ))}
            </div>
          </div>

          <p className="ai-chat-disclaimer">⚠️ AI can make mistakes. Verify the results.</p>
        </div>

        <div className="ai-chat-card ai-chat-threads">
          <div className="ai-chat-threads__head">
            <h3 className="ai-chat-threads__title">Recent Automated Conversations</h3>
            <span className="ai-chat-threads__link">View All History Logs</span>
          </div>

          <div className="ai-chat-threads__list">
            {RECENT_THREADS.map((thread) => (
              <div key={thread.id} className="ai-chat-thread">
                <span className="ai-chat-thread__title">{thread.title}</span>
                <span className="ai-chat-thread__time">{thread.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
