import { useId, useRef, useState } from "react";
import { Button, SideDrawer } from "../../../design-system/aurora";
import {
  CampaignError,
  commandKey,
  submitApplication,
} from "../api/c03-client";
import type {
  Asset,
  AuthorizedOpportunity,
  Brief,
  Receipt,
} from "../contracts/c03.contracts";
import { messageForError } from "../utils/c03-errors";
import { useCampaignScope } from "../hooks/campaign-scope-context";
import {
  assetName,
  selectablePairs,
  type ApplyDraft,
} from "../utils/c03-selection";
import {
  AssetContent,
  BriefContent,
  CommercialContent,
} from "./CampaignContent";

type Props = {
  opportunity: AuthorizedOpportunity;
  initialBriefId?: string;
  initialDraft?: ApplyDraft | null;
  onClose: (draft: ApplyDraft) => void;
  onRefresh: () => void;
  onSuccess: (receipt: Receipt) => void;
};
export function OpportunityApply({
  opportunity,
  initialBriefId,
  initialDraft,
  onClose,
  onRefresh,
  onSuccess,
}: Props) {
  const scope = useCampaignScope();
  const pairs = selectablePairs(opportunity);
  const picked = pairs.find((pair) => pair.brief.id === initialBriefId);
  const restored = pairs.find(
    (pair) =>
      pair.asset.id === initialDraft?.assetId &&
      pair.brief.id === initialDraft?.briefId,
  );
  const initial =
    picked ?? restored ?? (pairs.length === 1 ? pairs[0] : undefined);
  const [assetId, setAssetId] = useState(
    initial?.asset.id ??
      (pairs.some((pair) => pair.asset.id === initialDraft?.assetId)
        ? initialDraft!.assetId
        : ""),
  );
  const [briefId, setBriefId] = useState(initial?.brief.id ?? "");
  const [review, setReview] = useState(
    Boolean(initial && (picked || pairs.length === 1 || initialDraft?.review)),
  );
  const [submitting, setSubmitting] = useState(false);
  const busy = useRef(false);
  const [error, setError] = useState<unknown>(
    !picked && restored && initialDraft?.uncertain
      ? new CampaignError(0, null, true)
      : null,
  );
  const errorId = useId();
  const selected = pairs.find(
    (pair) => pair.asset.id === assetId && pair.brief.id === briefId,
  );
  const assets: Asset[] = opportunity.assets.filter((asset) =>
    pairs.some((pair) => pair.asset.id === asset.id),
  );
  const briefs: Brief[] = pairs
    .filter((pair) => pair.asset.id === assetId)
    .map((pair) => pair.brief);
  const submit = async () => {
    if (!selected || !review || busy.current || !opportunity.canApply) return;
    busy.current = true;
    setSubmitting(true);
    setError(null);
    const intent = `submit:${opportunity.campaign.id}:${assetId}:${briefId}`;
    try {
      const key = scope.command(intent, commandKey);
      const receipt = await submitApplication(
        scope,
        opportunity.campaign.id,
        assetId,
        briefId,
        key,
      );
      scope.assertCurrent();
      scope.finishCommand(intent);
      onSuccess(receipt);
    } catch (failure) {
      if (!scope.signal.aborted) {
        setError(failure);
        if (!(failure instanceof CampaignError) || !failure.uncertain)
          scope.finishCommand(intent);
      }
    } finally {
      busy.current = false;
      if (!scope.signal.aborted) setSubmitting(false);
    }
  };
  const uncertain = error instanceof CampaignError && error.uncertain;
  const close = () => onClose({ assetId, briefId, review, uncertain });
  return (
    <SideDrawer
      isOpen
      onClose={() => {
        if (!busy.current) close();
      }}
      title={review ? "Review Application" : "Choose Asset and Brief"}
      subtitle={opportunity.campaign.name}
      footer={
        <div className="cc-detail-cta-row">
          <Button variant="outline" disabled={submitting} onClick={close}>
            Cancel
          </Button>
          {review ? (
            <>
              <Button
                variant="outline"
                disabled={submitting || uncertain}
                onClick={() => {
                  setReview(false);
                  setError(null);
                }}
              >
                Change selection
              </Button>
              <Button
                disabled={submitting || !selected || (!!error && !uncertain)}
                aria-describedby={error ? errorId : undefined}
                onClick={() => void submit()}
              >
                {submitting
                  ? "Submitting…"
                  : uncertain
                    ? "Retry same Application"
                    : "Submit Application"}
              </Button>
            </>
          ) : (
            <Button
              disabled={!selected}
              onClick={() => {
                setError(null);
                setReview(true);
              }}
            >
              Review Application
            </Button>
          )}
        </div>
      }
    >
      <div className="c03-content">
        {error ? (
          <div role="alert" id={errorId}>
            <p>{messageForError(error)}</p>
            {!uncertain && (
              <Button variant="outline" onClick={onRefresh}>
                Refresh and review again
              </Button>
            )}
          </div>
        ) : null}
        <p role="status">
          {submitting
            ? "Submitting your reviewed Application…"
            : review
              ? "Review the exact selection and terms before submitting."
              : "Choose one Asset, then one associated Brief."}
        </p>
        {review && selected ? (
          <>
            <AssetContent asset={selected.asset} />
            <BriefContent definition={selected.brief.definition} />
            <CommercialContent commercial={opportunity.campaign.commercial} />
          </>
        ) : (
          <>
            <fieldset>
              <legend>Asset</legend>
              {assets.map((asset) => (
                <label className="c03-selection" key={asset.id}>
                  <input
                    type="radio"
                    name="campaign-asset"
                    value={asset.id}
                    checked={assetId === asset.id}
                    onChange={() => {
                      setAssetId(asset.id);
                      setBriefId("");
                    }}
                  />
                  {assetName(asset)}
                </label>
              ))}
            </fieldset>
            <fieldset disabled={!assetId}>
              <legend>Brief</legend>
              {briefs.map((brief) => (
                <label className="c03-selection" key={brief.id}>
                  <input
                    type="radio"
                    name="campaign-brief"
                    value={brief.id}
                    checked={briefId === brief.id}
                    onChange={() => setBriefId(brief.id)}
                  />
                  {brief.definition.briefName ?? "Brief"}
                </label>
              ))}
            </fieldset>
          </>
        )}
      </div>
    </SideDrawer>
  );
}
