import { useInstagramB4 } from "../hooks/use-instagram-b4";
import { InstagramWorkspace } from "./instagram-workspace";

export function InstagramB4View() {
  const state = useInstagramB4();
  const { data, error, isLoading } = state;
  if (isLoading)
    return (
      <main className="instagram-b4">
        <h1>Instagram Intelligence</h1>
        <p role="status">Loading Instagram Intelligence…</p>
      </main>
    );
  if (error || !data)
    return (
      <main className="instagram-b4">
        <h1>Instagram Intelligence</h1>
        <p role="alert">{error}</p>
      </main>
    );
  return (
    <InstagramWorkspace
      data={data}
      isRefreshing={state.isRefreshing}
      announcement={state.announcement}
      cooldownEndsAt={state.cooldownEndsAt}
      onRefresh={state.requestRefresh}
    />
  );
}
