import { useRef, useState, type FormEvent } from "react";
import { Button } from "../../../design-system/aurora/components/Button";
import { Card } from "../../../design-system/aurora/components/Card";
import { Badge } from "../../../design-system/aurora/components/Badge";
import { Alert } from "../../../design-system/aurora/components/Alert";
import { SideDrawer } from "../../../design-system/aurora/components/SideDrawer";
import { TextField } from "../../../design-system/aurora/components/TextField";
import { SelectField } from "../../../design-system/aurora/components/SelectField";
import { useCreatorWorkspaceActorState } from "../../../shared/creator/creator-workspace-actor-context-value";
import {
  PortfolioCommandSchema,
  PORTFOLIO_FILTERS,
  type PortfolioItem,
  type PortfolioFilter,
} from "../contracts/portfolio-consumer";
import { usePortfolio } from "../hooks/use-portfolio";
import "../portfolio.css";

const labels: Record<PortfolioFilter, string> = {
  ALL: "All",
  INSTAGRAM: "Instagram",
  CREATOR_SHOP: "Creator Shop",
  CREATOR_PROVIDED: "Added by me",
  REMOVED: "Removed",
};
const kindLabels: Record<PortfolioItem["kind"], string> = {
  INSTAGRAM_IMAGE: "Instagram post",
  INSTAGRAM_REEL: "Instagram Reel",
  INSTAGRAM_CAROUSEL: "Instagram carousel",
  INSTAGRAM_STORY: "Instagram Story",
  EXTERNAL: "External work",
  UGC: "UGC work",
};
export function PortfolioWorkspace() {
  const state = useCreatorWorkspaceActorState();
  const [filter, setFilter] = useState<PortfolioFilter>("ALL");
  if (!state || state.status === "LOADING")
    return (
      <p role="status" aria-busy="true">
        Verifying Creator workspace access…
      </p>
    );
  if (
    state.status !== "READY" ||
    !state.actorContext.allowedActions.includes("PORTFOLIO_READ")
  )
    return (
      <p role="alert">
        Portfolio access could not be verified. An active authorized membership
        is required.
      </p>
    );
  const scope = `${state.actorContext.subjectCreatorProfileId}:${state.actorContext.workspaceId}:${state.actorContext.organizationId}:${state.actorContext.actorUserId}:${state.actorContext.actorMembershipId}:${state.actorContext.actorRole}`;
  return (
    <div className="creator-portfolio">
      <header>
        <h1>Portfolio</h1>
        <p>
          Your individual work, with source and verification clearly
          distinguished. Remove or restore work without changing the source.
        </p>
      </header>
      <nav
        className="creator-portfolio__filters"
        aria-label="Portfolio filters"
      >
        {PORTFOLIO_FILTERS.map((value) => (
          <Button
            key={value}
            type="button"
            variant={filter === value ? "primary" : "outline"}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {labels[value]}
          </Button>
        ))}
      </nav>
      <PortfolioResults
        key={`${scope}:${filter}`}
        filter={filter}
        canCurate={state.actorContext.allowedActions.includes(
          "PORTFOLIO_CURATE",
        )}
      />
    </div>
  );
}
function PortfolioResults({
  filter,
  canCurate,
}: {
  filter: PortfolioFilter;
  canCurate: boolean;
}) {
  const model = usePortfolio(filter);
  const [editing, setEditing] = useState<PortfolioItem | null | undefined>(
    undefined,
  );
  const restore = useRef<HTMLButtonElement | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const data = model.data;
  const allowed = canCurate && !!data?.context.canCurate;
  return (
    <>
      <p
        className="creator-portfolio__announcement"
        role="status"
        aria-live="polite"
      >
        {model.announcement}
      </p>
      {model.error && (
        <div role="alert">
          <Alert
            title={
              data ? "Last confirmed work is shown" : "Portfolio unavailable"
            }
            tone="error"
          >
            {model.error}
          </Alert>
          <Button
            type="button"
            variant="outline"
            disabled={model.pending}
            onClick={() => void model.reload()}
          >
            Try again
          </Button>
        </div>
      )}
      {model.conflict && (
        <div role="alert">
          <Alert title="Review before saving" tone="warning">
            Your unsaved fields are retained. Review the latest work, then
            confirm to save against the updated Portfolio.
          </Alert>
          <Button type="button" onClick={model.reviewed}>
            I have reviewed the latest work
          </Button>
        </div>
      )}
      {actionError && <p role="alert">{actionError}</p>}
      {model.loading && (
        <p role="status" aria-busy="true">
          Loading Portfolio…
        </p>
      )}
      {data && (
        <>
          <div className="creator-portfolio__summary">
            <h2>Your work</h2>
            <p>
              {data.items.length} work references shown
              {data.nextCursor ? " · More work is available" : ""} ·{" "}
              {data.context.role === "ASSISTANT"
                ? "Read-only access"
                : "Curation access"}
            </p>
            {allowed && (
              <Button
                type="button"
                fullWidthOnMobile
                disabled={model.pending}
                onClick={(event) => {
                  restore.current = event.currentTarget;
                  setEditing(null);
                }}
              >
                Add work reference
              </Button>
            )}
          </div>
          {data.discovery !== "AVAILABLE" && (
            <Alert
              title={
                data.discovery === "PARTIAL"
                  ? "Some source work is unavailable"
                  : data.discovery === "NOT_PROCESSED"
                    ? "Instagram work has not been processed"
                    : "Instagram discovery is unavailable"
              }
              tone="warning"
            >
              Saved work remains available. Source discovery is not a statement
              that collaboration was absent.
            </Alert>
          )}
          {!model.error &&
            ["PARTIAL", "UNAVAILABLE"].includes(data.discovery) && (
              <Button
                type="button"
                variant="outline"
                disabled={model.pending}
                onClick={() => void model.reload()}
              >
                Retry saved-work view
              </Button>
            )}
          <p>
            Work opens at its original source. Access may require sign-in or
            permission. Previews and Story discovery are not available here.
          </p>
          {data.items.length === 0 && (
            <Card
              title={
                filter === "REMOVED"
                  ? "No removed work"
                  : "No work in this view"
              }
            >
              <p>
                {filter === "ALL"
                  ? "Verified completed work and supported Instagram collaboration cues appear when available. You can also add an individual external or UGC work reference."
                  : "Try another filter to view your saved work."}
              </p>
            </Card>
          )}
          <div className="creator-portfolio__grid">
            {data.items.map((item) => (
              <Card key={item.id} className="creator-portfolio__item">
                <article aria-label={item.title}>
                  <h3>{item.title}</h3>
                  <p>
                    <Badge tone="neutral">{kindLabels[item.kind]}</Badge>
                    {item.state === "REMOVED" ? " · Removed" : ""}
                  </p>
                  {item.workDate && (
                    <p>
                      Work date:{" "}
                      <time dateTime={item.workDate}>
                        {new Date(item.workDate).toLocaleDateString("en-GB", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          timeZone: "UTC",
                        })}
                      </time>
                    </p>
                  )}
                  {item.brandLabel && <p>{item.brandLabel}</p>}
                  {item.creatorContext && (
                    <p>Creator context: {item.creatorContext}</p>
                  )}
                  <ul className="creator-portfolio__sources">
                    {item.provenance.map((source, index) => (
                      <li key={`${source.source}:${index}`}>
                        {source.source === "INSTAGRAM" ? (
                          <>
                            Instagram Verified · Possible Collaboration ·{" "}
                            {source.confidence.toLowerCase()} observational
                            confidence · Sponsorship disclosure cue, not
                            confirmed collaboration · Observed{" "}
                            <time dateTime={source.observedAt}>
                              {source.observedAt.slice(0, 10)}
                            </time>
                          </>
                        ) : source.source === "CREATOR_SHOP" ? (
                          <>
                            Creator Shop Verified · Completed work · Verified{" "}
                            <time dateTime={source.verifiedAt}>
                              {source.verifiedAt.slice(0, 10)}
                            </time>
                          </>
                        ) : (
                          <>Creator Provided · Unverified work reference</>
                        )}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={item.destination}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open original work: ${item.title}`}
                  >
                    Open original work <span aria-hidden="true">↗</span>
                  </a>
                  <p>Source link only · Access requirements may apply</p>
                  {allowed && (
                    <div className="creator-portfolio__actions">
                      {item.provenance.every(
                        (p) => p.source === "CREATOR_PROVIDED",
                      ) && (
                        <Button
                          type="button"
                          variant="outline"
                          disabled={model.pending}
                          onClick={(event) => {
                            restore.current = event.currentTarget;
                            setEditing(item);
                          }}
                        >
                          Edit {item.title}
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        disabled={model.pending || model.conflict}
                        onClick={() =>
                          void model.submit({
                            intent:
                              item.state === "REMOVED" ? "RESTORE" : "REMOVE",
                            itemId: item.id,
                            expectedRevision: data.currentRevision,
                            idempotencyKey: crypto.randomUUID(),
                          })
                        }
                      >
                        {item.state === "REMOVED" ? "Restore" : "Remove"}{" "}
                        {item.title}
                      </Button>
                    </div>
                  )}
                </article>
              </Card>
            ))}
          </div>
          {data.nextCursor && (
            <Button
              type="button"
              variant="outline"
              disabled={model.pending}
              onClick={() => void model.loadMore()}
            >
              Load more work
            </Button>
          )}
        </>
      )}
      {editing !== undefined && allowed && data && (
        <ReferenceForm
          key={editing?.id ?? "new"}
          item={editing}
          revision={data.currentRevision}
          pending={model.pending}
          conflict={model.conflict}
          latest={data.items}
          reviewed={model.reviewed}
          restore={restore}
          close={() => setEditing(undefined)}
          submit={async (value) => {
            setActionError(null);
            const parsed = PortfolioCommandSchema.safeParse(value);
            if (!parsed.success) {
              setActionError(
                "Check the stable HTTPS work link and required fields.",
              );
              return false;
            }
            return model.submit(parsed.data);
          }}
        />
      )}
    </>
  );
}
function ReferenceForm({
  item,
  revision,
  pending,
  conflict,
  latest,
  reviewed,
  restore,
  close,
  submit,
}: {
  item: PortfolioItem | null;
  revision: number;
  pending: boolean;
  conflict: boolean;
  latest: PortfolioItem[];
  reviewed: () => void;
  restore: React.RefObject<HTMLButtonElement>;
  close: () => void;
  submit: (value: unknown) => Promise<boolean>;
}) {
  const [title, setTitle] = useState(item?.title ?? ""),
    [destination, setDestination] = useState(item?.destination ?? ""),
    [context, setContext] = useState(item?.creatorContext ?? ""),
    [kind, setKind] = useState<"EXTERNAL" | "UGC">(
      item?.kind === "UGC" ? "UGC" : "EXTERNAL",
    ),
    [date, setDate] = useState(item?.workDate?.slice(0, 10) ?? ""),
    [error, setError] = useState<string | null>(null);
  const retry = useRef<{ body: string; key: string } | null>(null);
  const save = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const body = {
      intent: item ? "EDIT_REFERENCE" : "ADD_REFERENCE",
      expectedRevision: revision,
      ...(item ? { itemId: item.id } : { kind }),
      destination,
      title,
      creatorContext: context || null,
      workDate: date ? `${date}T00:00:00.000Z` : null,
    };
    const serialized = JSON.stringify(body);
    if (retry.current?.body !== serialized)
      retry.current = { body: serialized, key: crypto.randomUUID() };
    const command = { ...body, idempotencyKey: retry.current.key };
    const parsed = PortfolioCommandSchema.safeParse(command);
    if (!parsed.success) {
      setError(
        "Use a stable HTTPS work link and complete the required fields.",
      );
      return;
    }
    if (await submit(command)) close();
    else setError("Work was not saved. Your fields are preserved.");
  };
  return (
    <SideDrawer
      isOpen
      onClose={() => {
        if (!pending) close();
      }}
      title={item ? "Edit work reference" : "Add work reference"}
      subtitle="Individual external or UGC work only. This does not verify a collaboration or upload media."
      restoreFocusRef={restore}
      className="creator-portfolio__drawer"
    >
      <form
        onSubmit={(event) => void save(event)}
        className="creator-portfolio__form"
      >
        {error && <p role="alert">{error}</p>}
        {conflict && (
          <div role="alert">
            <p>
              Review the latest confirmed work below. Your unsaved fields are
              retained.
            </p>
            <ul>
              {latest.map((work) => (
                <li key={work.id}>
                  {work.title} ·{" "}
                  {work.state === "REMOVED" ? "Removed" : "Included"}
                </li>
              ))}
            </ul>
            <Button type="button" onClick={reviewed}>
              I have reviewed the latest work
            </Button>
          </div>
        )}
        <fieldset disabled={pending} className="creator-portfolio__form">
          <legend>Work reference details</legend>
          <TextField
            label="Work title"
            required
            maxLength={160}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          {!item && (
            <SelectField
              label="Work type"
              value={kind}
              options={[
                { value: "EXTERNAL", label: "External work" },
                { value: "UGC", label: "UGC work" },
              ]}
              onChange={(event) =>
                setKind(event.target.value as "EXTERNAL" | "UGC")
              }
            />
          )}
          <TextField
            label="Original work link"
            required
            type="url"
            maxLength={4096}
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
            aria-describedby="portfolio-link-help"
          />
          <p id="portfolio-link-help">
            Stable HTTPS source link only. No temporary media, signed links or
            uploads. Access may require permission.
          </p>
          <TextField
            label="Creator context (optional)"
            multiline
            maxLength={300}
            value={context}
            onChange={(event) => setContext(event.target.value)}
          />
          <TextField
            label="Work date (optional)"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </fieldset>
        <Button type="submit" fullWidthOnMobile disabled={pending || conflict}>
          {pending ? "Saving…" : "Save work reference"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={close}
        >
          Cancel
        </Button>
      </form>
    </SideDrawer>
  );
}
