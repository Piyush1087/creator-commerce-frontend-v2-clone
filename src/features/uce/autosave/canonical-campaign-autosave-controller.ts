export type AutosaveKey = string;
export type AutosaveStatus = "idle" | "dirty" | "saving" | "saved" | "failed-retryable";

type Entry<T> = {
  accepted?: string;
  inFlight?: Promise<void>;
  revision: number;
  status: AutosaveStatus;
  timer?: ReturnType<typeof setTimeout>;
  value: T;
};

/**
 * Owns local, field-scoped draft persistence. A response only changes state when
 * it still belongs to the latest revision for that field, so an older PATCH can
 * never overwrite a newer local change or clear its dirty state.
 */
export class CanonicalCampaignAutosaveController<T> {
  private readonly entries = new Map<AutosaveKey, Entry<T>>();
  private disposed = false;

  constructor(
    private readonly save: (key: AutosaveKey, value: T) => Promise<void>,
    private readonly delay = 350,
    private readonly onStatusChange?: () => void,
  ) {}

  schedule(key: AutosaveKey, value: T, immediate = false): void {
    if (this.disposed) return;
    const fingerprint = JSON.stringify(value);
    const prior = this.entries.get(key);

    if (prior?.accepted === fingerprint && prior.status === "saved") return;
    if (prior && JSON.stringify(prior.value) === fingerprint && prior.status !== "failed-retryable") return;

    if (prior?.timer) clearTimeout(prior.timer);
    const entry: Entry<T> = {
      revision: (prior?.revision ?? 0) + 1,
      status: "dirty",
      value,
    };
    this.entries.set(key, entry);
    this.notify();

    if (immediate) {
      void this.run(key, entry.revision);
      return;
    }
    entry.timer = setTimeout(() => void this.run(key, entry.revision), this.delay);
  }

  /** Cancels a conditional field after its parent change makes it inapplicable. */
  forget(key: AutosaveKey): void {
    const entry = this.entries.get(key);
    if (!entry) return;
    if (entry.timer) clearTimeout(entry.timer);
    this.entries.delete(key);
    this.notify();
  }

  async flush(keys?: readonly AutosaveKey[]): Promise<boolean> {
    const requested = keys ?? [...this.entries.keys()];
    const settled = await Promise.all(requested.map((key) => this.flushKey(key)));
    return settled.every(Boolean);
  }

  retry(key: AutosaveKey): void {
    const entry = this.entries.get(key);
    if (entry?.status === "failed-retryable") this.schedule(key, entry.value, true);
  }

  status(key: AutosaveKey): AutosaveStatus {
    return this.entries.get(key)?.status ?? "idle";
  }

  hasPendingOrFailed(keys?: readonly AutosaveKey[]): boolean {
    const requested = keys ?? [...this.entries.keys()];
    return requested.some((key) => {
      const status = this.status(key);
      return status === "dirty" || status === "saving" || status === "failed-retryable";
    });
  }

  dispose(): void {
    this.disposed = true;
    this.entries.forEach((entry) => entry.timer && clearTimeout(entry.timer));
    this.entries.clear();
  }

  private async flushKey(key: AutosaveKey): Promise<boolean> {
    while (!this.disposed) {
      const entry = this.entries.get(key);
      if (!entry || entry.status === "idle" || entry.status === "saved") return true;
      if (entry.status === "failed-retryable") return false;
      if (entry.status === "saving") {
        await entry.inFlight;
        continue;
      }
      if (entry.timer) clearTimeout(entry.timer);
      await this.run(key, entry.revision);
    }
    return false;
  }

  private async run(key: AutosaveKey, revision: number): Promise<void> {
    const entry = this.entries.get(key);
    if (!entry || this.disposed || entry.revision !== revision) return;
    if (entry.status === "saving") return entry.inFlight;
    if (entry.timer) clearTimeout(entry.timer);
    entry.timer = undefined;
    entry.status = "saving";
    this.notify();

    const value = entry.value;
    entry.inFlight = this.save(key, value)
      .then(() => {
        const latest = this.entries.get(key);
        if (!this.disposed && latest?.revision === revision) {
          latest.accepted = JSON.stringify(value);
          latest.status = "saved";
          this.notify();
        }
      })
      .catch(() => {
        const latest = this.entries.get(key);
        if (!this.disposed && latest?.revision === revision) {
          latest.status = "failed-retryable";
          this.notify();
        }
      });
    await entry.inFlight;
  }

  private notify(): void {
    this.onStatusChange?.();
  }
}
