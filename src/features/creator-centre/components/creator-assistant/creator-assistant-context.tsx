import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { MOCK_ASSISTANT } from "../../mock-data/centre-mock";

export type AssistantMessage = {
  id: string;
  role: "assistant" | "user" | "status";
  text: string;
};

export type AssistantExecutionAction = {
  id: string;
  label: string;
  variant: "primary" | "outline";
};

type CreatorAssistantContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  draft: string;
  setDraft: (value: string) => void;
  messages: AssistantMessage[];
  isDrafting: boolean;
  executionActions: AssistantExecutionAction[] | null;
  clearExecutionActions: () => void;
  sendMessage: (text?: string) => void;
};

const CreatorAssistantContext = createContext<CreatorAssistantContextValue | null>(
  null,
);

const INITIAL_MESSAGES: AssistantMessage[] = [
  {
    id: "greeting",
    role: "assistant",
    text: MOCK_ASSISTANT.greeting,
  },
];

export function CreatorAssistantProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<AssistantMessage[]>(INITIAL_MESSAGES);
  const [isDrafting, setIsDrafting] = useState(false);
  const [executionActions, setExecutionActions] = useState<
    AssistantExecutionAction[] | null
  >(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sendMessage = useCallback(
    (text?: string) => {
      const content = (text ?? draft).trim();
      if (!content || isDrafting) return;

      const userId = `user-${Date.now()}`;
      const statusId = `status-${Date.now()}`;

      setExecutionActions(null);
      setMessages((prev) => [
        ...prev,
        { id: userId, role: "user", text: content },
        {
          id: statusId,
          role: "status",
          text: "Drafting reply…",
        },
      ]);
      setDraft("");
      setIsDrafting(true);

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== statusId),
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            text: `Here's a draft reply based on what you asked:\n\n"${content.slice(0, 120)}${content.length > 120 ? "…" : ""}"\n\nI can refine the tone, add pricing, or turn this into a brand pitch. What should we adjust?`,
          },
        ]);
        setExecutionActions([...MOCK_ASSISTANT.executionActions]);
        setIsDrafting(false);
      }, 1200);
    },
    [draft, isDrafting],
  );

  const value = useMemo(
    () => ({
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      toggle: () => setIsOpen((prev) => !prev),
      draft,
      setDraft,
      messages,
      isDrafting,
      executionActions,
      clearExecutionActions: () => setExecutionActions(null),
      sendMessage,
    }),
    [isOpen, draft, messages, isDrafting, executionActions, sendMessage],
  );

  return (
    <CreatorAssistantContext.Provider value={value}>
      {children}
    </CreatorAssistantContext.Provider>
  );
}

export function useCreatorAssistant() {
  const ctx = useContext(CreatorAssistantContext);
  if (!ctx) {
    throw new Error("useCreatorAssistant must be used within CreatorAssistantProvider");
  }
  return ctx;
}
