// @vitest-environment jsdom
import { createElement } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createChatConversation,
  getChatConversation,
  listChatConversations,
  patchChatConversation,
  postChatTurn,
} from "../api/chat-client";
import { AUTH_ROUTES } from "../../auth/constants";
import { BrandDashboardPage } from "../../../pages/brand/dashboard/brand-dashboard-page";
import {
  CHAT_TEST_IDS,
  chatConversationFixture,
  chatResponseFixture,
} from "../testing/chat-fixtures";
import { getBrandHome } from "../../brand-dashboard/api/brand-home-client";
import { brandHomeResponseFixture } from "../../brand-dashboard/testing/brand-home-fixtures";

vi.mock("../api/chat-client", () => ({
  createChatConversation: vi.fn(),
  getChatConversation: vi.fn(),
  listChatConversations: vi.fn(),
  patchChatConversation: vi.fn(),
  postChatTurn: vi.fn(),
}));

vi.mock("../../brand-dashboard/api/brand-home-client", () => ({
  getBrandHome: vi.fn(),
}));

const createMock = vi.mocked(createChatConversation);
const getMock = vi.mocked(getChatConversation);
const listMock = vi.mocked(listChatConversations);
const patchMock = vi.mocked(patchChatConversation);
const turnMock = vi.mocked(postChatTurn);
const homeMock = vi.mocked(getBrandHome);

function mount(includeCampaignRoute = false) {
  const dashboard = createElement(Route, {
    path: AUTH_ROUTES.brandDashboard,
    element: createElement(BrandDashboardPage),
  });
  const campaign = includeCampaignRoute
    ? createElement(Route, {
        path: AUTH_ROUTES.brandUceCampaignDetail,
        element: createElement("h1", null, "Authorized Campaign detail"),
      })
    : null;
  return render(
    createElement(
      MemoryRouter,
      { initialEntries: [AUTH_ROUTES.brandDashboard] },
      createElement(Routes, null, dashboard, campaign),
    ),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  const conversation = chatConversationFixture();
  listMock.mockResolvedValue([conversation]);
  getMock.mockResolvedValue({ conversation, messages: [] });
  homeMock.mockResolvedValue(brandHomeResponseFixture());
});

afterEach(cleanup);

describe("Brand Home permanent Chat integration", () => {
  it("bootstraps Ask Creator Shop and renders the backend-grounded first vertical", async () => {
    turnMock.mockResolvedValueOnce(chatResponseFixture());
    mount();

    const composer = await screen.findByLabelText("Message Ask Creator Shop");
    expect(screen.getByRole("heading", { name: "Brand Home" })).toBeTruthy();
    fireEvent.change(composer, {
      target: {
        value: "What does Creator Shop understand about my Brand and Products?",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));

    expect(
      await screen.findByText(
        "Creator Shop understands your Brand and current Products.",
      ),
    ).toBeTruthy();
    expect(screen.getByText("Creator Shop records")).toBeTruthy();
    expect(screen.getByText("Creator Shop Intelligence")).toBeTruthy();
    expect(turnMock).toHaveBeenCalledTimes(1);
  });

  it("creates, selects, and archives permanent conversations", async () => {
    const first = chatConversationFixture();
    const second = chatConversationFixture({
      id: CHAT_TEST_IDS.secondConversation,
      title: "Campaign history",
    });
    listMock.mockResolvedValueOnce([first, second]);
    getMock.mockImplementation(async (id) => ({
      conversation: id === second.id ? second : first,
      messages: [],
    }));
    createMock.mockResolvedValueOnce(second);
    patchMock.mockResolvedValueOnce(
      chatConversationFixture({
        id: second.id,
        archivedAt: "2026-09-01T10:00:00.000Z",
      }),
    );
    mount();
    await screen.findByLabelText("Message Ask Creator Shop");

    fireEvent.click(screen.getByRole("button", { name: "Open recent chats" }));
    fireEvent.click(screen.getByRole("button", { name: /^Campaign history/ }));
    await waitFor(() => expect(getMock).toHaveBeenLastCalledWith(second.id));

    fireEvent.click(screen.getByRole("button", { name: "Open recent chats" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Archive Campaign history" }),
    );
    await waitFor(() =>
      expect(patchMock).toHaveBeenCalledWith(second.id, { archived: true }),
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Create new Chat conversation" }),
    );
    await waitFor(() => expect(createMock).toHaveBeenCalledWith({}));
  });

  it("maps an authorized Campaign navigation response through React Router", async () => {
    const navigation = chatResponseFixture({
      status: "NAVIGATION",
      answer: "Opening Summer Launch.",
      navigation: {
        destinationId: "CAMPAIGNS",
        entityRef: { type: "CAMPAIGN", id: CHAT_TEST_IDS.campaign },
      },
    });
    turnMock.mockResolvedValueOnce(navigation);
    mount(true);
    const composer = await screen.findByLabelText("Message Ask Creator Shop");
    fireEvent.change(composer, {
      target: { value: "Open Campaign Summer Launch" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    expect(await screen.findByText("Authorized Campaign detail")).toBeTruthy();
  });

  it("shows a bounded error and does not fabricate an assistant answer", async () => {
    turnMock.mockRejectedValueOnce(new Error("Chat service is unavailable."));
    mount();
    const composer = await screen.findByLabelText("Message Ask Creator Shop");
    fireEvent.change(composer, { target: { value: "Please retry safely" } });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));

    expect(
      await screen.findByText("Chat service is unavailable."),
    ).toBeTruthy();
    expect(screen.getByText("Chat unavailable")).toBeTruthy();
    expect(screen.queryByText("Answered")).toBeNull();
    expect((composer as HTMLTextAreaElement).value).toBe("Please retry safely");
  });

  it("keeps permanent Chat usable when the Home request fails", async () => {
    homeMock.mockRejectedValueOnce(new Error("Home request failed"));
    mount();

    expect(await screen.findByText("Could not load Brand Home")).toBeTruthy();
    expect(await screen.findByLabelText("Message Ask Creator Shop")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Send message" })).toBeTruthy();
  });

  it("opens and closes an accessible mobile Chat dialog", async () => {
    mount();
    await screen.findByLabelText("Message Ask Creator Shop");
    fireEvent.click(
      screen.getByRole("button", { name: "Open Ask Creator Shop" }),
    );
    const dialog = screen.getByRole("dialog", {
      name: "Ask Creator Shop Chat",
    });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(
      screen.getByRole("button", { name: "Close Ask Creator Shop" }),
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Close Ask Creator Shop backdrop",
      }),
    );
    expect(
      screen.queryByRole("dialog", { name: "Ask Creator Shop Chat" }),
    ).toBeNull();
  });
});
