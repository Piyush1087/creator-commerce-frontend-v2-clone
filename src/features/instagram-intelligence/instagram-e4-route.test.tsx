// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { InstagramB4View } from "./components/instagram-b4-view";
import {
  instagramB4Fixture,
  instagramMediaDetailFixture,
} from "./testing/instagram-b4-fixture";

const mocks = vi.hoisted(() => ({
  retry: vi.fn(),
  useB4: vi.fn(),
  useDetail: vi.fn(),
}));
vi.mock("./hooks/use-instagram-b4", () => ({
  useInstagramB4: mocks.useB4,
}));
vi.mock("./hooks/use-instagram-media-detail", () => ({
  useInstagramMediaDetail: mocks.useDetail,
}));
vi.mock("../../shared/auth/use-auth-session", () => ({
  useAuthSession: () => ({ currentUser: { id: "synthetic-user" } }),
}));

function RouteState() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output aria-label="Current route">{location.pathname}</output>
      <button type="button" onClick={() => navigate(-1)}>
        History back
      </button>
      <button type="button" onClick={() => navigate(1)}>
        History forward
      </button>
    </>
  );
}

function app(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <RouteState />
      <Routes>
        <Route path="/brand-centre/instagram/*" element={<InstagramB4View />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mocks.useB4.mockReturnValue({
    data: instagramB4Fixture(),
    error: null,
    isLoading: false,
    isRefreshing: false,
    announcement: "",
    cooldownEndsAt: null,
    requestRefresh: vi.fn(),
  });
  mocks.useDetail.mockReturnValue({
    state: { kind: "DETAIL_READY", detail: instagramMediaDetailFixture() },
    retry: mocks.retry,
  });
});

afterEach(() => {
  cleanup();
  mocks.retry.mockReset();
  mocks.useB4.mockReset();
  mocks.useDetail.mockReset();
});

describe("Instagram E4 canonical route authority", () => {
  it("pushes detail from a distinguishable post action and history reopens it", async () => {
    app("/brand-centre/instagram");
    const origin = screen.getByRole("button", {
      name: /View post details for Reels published/i,
    });
    origin.focus();
    fireEvent.click(origin);
    expect(screen.getByLabelText("Current route").textContent).toBe(
      "/brand-centre/instagram/media/synthetic-media-1",
    );
    expect(screen.getByRole("dialog", { name: "Post details" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "History back" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.activeElement).toBe(origin);
    fireEvent.click(screen.getByRole("button", { name: "History forward" }));
    await waitFor(() => expect(screen.getByRole("dialog")).toBeTruthy());
  });

  it("loads direct detail URLs and close returns to the deterministic workspace heading", async () => {
    app("/brand-centre/instagram/media/synthetic-media-1?source=direct#detail");
    expect(screen.getByRole("dialog", { name: "Post details" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Close post details" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.getByLabelText("Current route").textContent).toBe(
      "/brand-centre/instagram",
    );
    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole("heading", { name: "Representative posts" }),
      ),
    );
  });

  it("fails closed for malformed or non-canonical nested segments", () => {
    app("/brand-centre/instagram/media/segment/extra");
    expect(screen.getByText(/could not be safely displayed/i)).toBeTruthy();
  });
});
