import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card } from "../../../design-system/aurora";
import { AUTH_ROUTES } from "../../auth/constants";
import { useCreatorBrand } from "../hooks/use-creator-brand";
import {
  CreatorBrandProfileInputSchema,
  emptyCreatorBrandProfile,
  type CreatorBrandProfileInput,
  type CreatorBrandCommand,
} from "../contracts/creator-brand-profile.contract";
import type { CreatorBrandCandidate } from "../contracts/creator-brand-suggestions.schema";
import {
  CreatorBrandField,
  sections,
  fieldLabels,
  valueLabel,
  candidateTarget,
  candidateDraft,
} from "./creator-brand-fields";
import "../creator-brand.css";

export function CreatorBrandWorkspace() {
  const state = useCreatorBrand();
  const [draft, setDraft] = useState<CreatorBrandProfileInput | null>(null);
  const [editingCandidate, setEditingCandidate] =
    useState<CreatorBrandCandidate | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const heading = useRef<HTMLHeadingElement>(null);
  const editor = useRef<HTMLDivElement>(null);
  const errorBox = useRef<HTMLDivElement>(null);
  const submission = useRef<{ fingerprint: string; key: string } | null>(null);
  const focusEditor = () =>
    requestAnimationFrame(() =>
      editor.current
        ?.querySelector<HTMLElement>("textarea, input, button")
        ?.focus(),
    );
  const open = (candidate?: CreatorBrandCandidate) => {
    if (!state.data) return;
    const profile = state.data.profile ?? emptyCreatorBrandProfile();
    const next = candidate ? candidateDraft(profile, candidate) : profile;
    if (!next) return;
    setDraft(structuredClone(next));
    setEditingCandidate(candidate ?? null);
    setFieldErrors({});
    submission.current = null;
    state.reviewed();
    focusEditor();
  };
  const close = () => {
    setDraft(null);
    setEditingCandidate(null);
    setFieldErrors({});
    submission.current = null;
    state.reviewed();
    requestAnimationFrame(() => heading.current?.focus());
  };
  const send = async (candidate?: CreatorBrandCandidate) => {
    if (!state.data || state.pending || state.conflict) return;
    const selected = candidate ?? editingCandidate;
    const reference =
      selected && state.data.suggestions.objectGenerationId
        ? {
            objectGenerationId: state.data.suggestions.objectGenerationId,
            componentGenerationId: selected.componentGenerationId,
            candidateId: selected.candidateId,
          }
        : null;
    if (selected && !reference) return;
    let values: CreatorBrandProfileInput | undefined;
    if (!candidate) {
      const parsed = CreatorBrandProfileInputSchema.safeParse(draft);
      if (!parsed.success) {
        setFieldErrors(
          Object.fromEntries(
            parsed.error.issues.map((issue) => [
              String(issue.path[0]),
              issue.message,
            ]),
          ),
        );
        requestAnimationFrame(() => errorBox.current?.focus());
        return;
      }
      values = parsed.data;
    }
    const body = candidate
      ? { intent: "USE_SUGGESTION" as const, suggestionReference: reference! }
      : editingCandidate
        ? {
            intent: "EDIT_SUGGESTION" as const,
            suggestionReference: reference!,
            values: values!,
          }
        : { intent: "MANUAL" as const, values: values! };
    const fingerprint = JSON.stringify({
      ...body,
      expectedRevision: state.data.currentRevision,
    });
    if (!submission.current || submission.current.fingerprint !== fingerprint)
      submission.current = { fingerprint, key: crypto.randomUUID() };
    const command: CreatorBrandCommand = {
      ...body,
      expectedRevision: state.data.currentRevision,
      idempotencyKey: submission.current.key,
    };
    if (await state.submit(command)) close();
    else requestAnimationFrame(() => errorBox.current?.focus());
  };
  const data = state.data;
  const canEdit =
    data?.context.allowedActions.includes("CREATOR_BRAND_EDIT") ?? false;
  const canConfirm =
    data?.context.allowedActions.includes("CREATOR_BRAND_CONFIRM_SUGGESTION") ??
    false;
  const families = data ? Object.entries(data.suggestions.families) : [];
  const current =
    data?.suggestions.freshness === "CURRENT" &&
    ["AVAILABLE", "PARTIAL"].includes(data.suggestions.state);
  return (
    <div className="creator-brand-workspace">
      <h1 tabIndex={-1} ref={heading}>
        Creator Brand
      </h1>
      <p>
        Define how Brands should understand you. Only your explicit confirmation
        changes Creator Brand.
      </p>
      <p role="status" aria-live="polite">
        {state.announcement}
      </p>
      {(state.error || Object.keys(fieldErrors).length > 0) && (
        <div
          ref={errorBox}
          tabIndex={-1}
          role="alert"
          className="creator-brand-error"
        >
          {state.error ?? "Review the highlighted fields before saving."}
          {state.conflict && (
            <p>
              Review the latest confirmed values below. Cancel this draft and
              reopen editing to continue.
            </p>
          )}
        </div>
      )}
      {state.loading && !data && (
        <p role="status" aria-busy="true">
          Loading Creator Brand…
        </p>
      )}
      {!state.loading && !data && (
        <Button onClick={() => void state.retry()}>Try again</Button>
      )}
      {data && (
        <>
          <div className="creator-brand-identity">
            {data.identity.avatarImageReference && (
              <img
                src={data.identity.avatarImageReference}
                alt=""
                onError={(event) => {
                  event.currentTarget.hidden = true;
                }}
              />
            )}
            <div>
              <p>{data.identity.creatorName ?? "Creator name not available"}</p>
              <p>
                {data.identity.primaryInstagramHandle
                  ? `@${data.identity.primaryInstagramHandle.replace(/^@/, "")}`
                  : "No connected Instagram handle"}
              </p>
            </div>
          </div>
          {!data.profile && (
            <p>
              Your Creator Brand is not yet configured. You can write every
              field without Instagram or Content suggestions.
            </p>
          )}
          {!draft && canEdit && (
            <Button onClick={() => open()}>
              {data.profile
                ? "Edit Creator Brand"
                : "Set up Creator Brand / Write my own"}
            </Button>
          )}
          {state.error && (
            <p>
              Previously loaded confirmed values remain visible. Transport
              failure does not change source truth.
            </p>
          )}
          <Button
            variant="secondary"
            disabled={state.pending || !!draft}
            onClick={() => void state.retry()}
          >
            Reload confirmed values
          </Button>
          {draft && (
            <div
              ref={editor}
              className="creator-brand-editor"
              aria-busy={state.pending}
            >
              <h2>
                {editingCandidate
                  ? "Edit suggestion before using"
                  : "Edit Creator Brand"}
              </h2>
              <p>Unsaved draft — not confirmed Creator Brand.</p>
              <fieldset disabled={state.pending || state.conflict}>
                {(editingCandidate
                  ? [candidateTarget(editingCandidate)]
                  : sections.flatMap((section) => section.fields)
                ).map((field) => (
                  <div key={field}>
                    <h3>{fieldLabels[field]}</h3>
                    <CreatorBrandField
                      field={field}
                      draft={draft}
                      onChange={setDraft}
                      error={fieldErrors[field]}
                    />
                  </div>
                ))}
              </fieldset>
              <div className="creator-brand-actions">
                <Button
                  disabled={state.pending || state.conflict}
                  onClick={() => void send()}
                >
                  Save Creator Brand
                </Button>
                <Button
                  variant="secondary"
                  disabled={state.pending}
                  onClick={close}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
          {sections.map((section) => (
            <Card key={section.title}>
              <h2>{section.title}</h2>
              {section.fields.map((field) => (
                <div className="creator-brand-field" key={field}>
                  <h3>{fieldLabels[field]}</h3>
                  <p className="creator-brand-confirmed">
                    {data.profile
                      ? valueLabel(field, data.profile[field])
                      : "Not yet configured"}
                  </p>
                  {field === "creatorArchetypeIds" && (
                    <p>
                      Creator style is self-description, not proven fit or
                      willingness to accept UGC projects.
                    </p>
                  )}
                  {field === "commercialBio" && <p>Creator-authored only.</p>}
                  {families
                    .flatMap(([, family]) =>
                      family.availability === "AVAILABLE"
                        ? family.candidates
                        : [],
                    )
                    .filter((item) => candidateTarget(item) === field)
                    .map((item) => {
                      const next = candidateDraft(
                        data.profile ?? emptyCreatorBrandProfile(),
                        item,
                      );
                      const reflected =
                        next &&
                        JSON.stringify(next[field]) ===
                          JSON.stringify(data.profile?.[field]);
                      const actionable =
                        current &&
                        item.confirmable &&
                        next &&
                        canConfirm &&
                        !reflected &&
                        !draft &&
                        !state.conflict;
                      return (
                        <div
                          className="creator-brand-suggestion"
                          key={item.candidateId}
                        >
                          <p>Creator Shop suggestion</p>
                          <p>
                            {typeof item.value === "object" &&
                            !Array.isArray(item.value)
                              ? item.value.words.join(" · ")
                              : next
                                ? valueLabel(field, next[field])
                                : "Suggestion unavailable for confirmation"}
                          </p>
                          <p>
                            {item.confidence} support · {item.supportingPosts}{" "}
                            supporting posts
                          </p>
                          {reflected ? (
                            <p>Already reflected in confirmed values.</p>
                          ) : !item.confirmable ? (
                            <p>
                              Supporting cue only. Choose exact palette values
                              manually.
                            </p>
                          ) : !current ? (
                            <p>Not currently available for confirmation.</p>
                          ) : null}
                          {actionable && (
                            <div className="creator-brand-actions">
                              <Button
                                disabled={state.pending}
                                onClick={() => void send(item)}
                              >
                                Use suggestion for {fieldLabels[field]}
                              </Button>
                              <Button
                                variant="secondary"
                                disabled={state.pending}
                                onClick={() => open(item)}
                              >
                                Edit {fieldLabels[field]} before using
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              ))}
            </Card>
          ))}
          <section aria-label="Suggestion source context">
            <h2>Supporting context</h2>
            <p>
              Suggestions: {data.suggestions.state.toLowerCase()} · Freshness:{" "}
              {data.suggestions.freshness.toLowerCase()} · Processing:{" "}
              {data.suggestions.processing.toLowerCase()}
            </p>
            {!families.some(([, family]) => family.candidates.length) && (
              <p>
                No usable suggestions. Authorized members can still maintain
                Creator Brand manually.
              </p>
            )}
            {!!data.suggestions.limitations.length && (
              <p>
                Source support is limited or unavailable. Confirmed Creator
                Brand is unchanged.
              </p>
            )}
            <Link to={AUTH_ROUTES.creatorSettingsInstagram}>
              Instagram Settings
            </Link>
          </section>
        </>
      )}
    </div>
  );
}
