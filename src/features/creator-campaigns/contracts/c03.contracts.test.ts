import { describe, expect, it } from "vitest";
import { opportunitySchema, commercialSchema } from "./c03.contracts";
import { toCreatorWorkspaceActorContext } from "../../../shared/creator/creator-workspace-actor-mapper";
import type { CreatorWorkspaceActorContextResponse } from "../../settings/contracts/creator-team.contracts";

describe("C03 disclosure and actor boundaries", () => {
  const teaser = {
    schemaVersion: 1,
    state: "TEASER",
    reason: "AUTHENTICATION_REQUIRED",
    recoveryAction: "SIGN_IN_OR_CREATE_CREATOR",
    campaign: {
      id: "10000000-0000-4000-8000-000000000001",
      name: "Campaign",
      platforms: ["INSTAGRAM"],
    },
  };
  it("accepts safe teaser and rejects private field smuggling at both levels", () => {
    expect(opportunitySchema.safeParse(teaser).success).toBe(true);
    expect(opportunitySchema.safeParse({ ...teaser, assets: [] }).success).toBe(
      false,
    );
    expect(
      opportunitySchema.safeParse({
        ...teaser,
        campaign: { ...teaser.campaign, commercial: { offer: "900" } },
      }).success,
    ).toBe(false);
  });
  it("LOCKED has no campaign identity", () => {
    const locked = {
      schemaVersion: 1,
      state: "LOCKED",
      reason: "OPPORTUNITY_NOT_AVAILABLE",
      recoveryAction: null,
    };
    expect(opportunitySchema.safeParse(locked).success).toBe(true);
    expect(
      opportunitySchema.safeParse({ ...locked, campaign: teaser.campaign })
        .success,
    ).toBe(false);
  });
  it("preserves zero, false and unknown support value without defaulting missing fields", () => {
    const commercial = {
      compensationModel: "FIXED",
      offer: "0",
      currency: "INR",
      receivesBrandSupport: false,
      brandSupportType: null,
      brandSupportEstimatedValue: null,
    };
    expect(commercialSchema.parse(commercial)).toEqual(commercial);
    expect(
      commercialSchema.safeParse({ ...commercial, offer: null }).success,
    ).toBe(false);
    expect(
      commercialSchema.safeParse({
        ...commercial,
        receivesBrandSupport: undefined,
      }).success,
    ).toBe(false);
  });
  it.each(["OWNER", "MANAGER", "ASSISTANT"] as const)(
    "preserves %s actions and independent subject",
    (role) => {
      const value: CreatorWorkspaceActorContextResponse = {
        actor_user_id: role === "OWNER" ? "owner" : "member",
        actor_membership_id: "membership",
        actor_role: role,
        workspace_id: "workspace",
        organization_id: "organization",
        subject_creator_profile_id: "creator",
        subject_owner_user_id: "owner",
        allowed_actions: [
          "CAMPAIGN_OPPORTUNITY_VIEW",
          "CAMPAIGN_APPLICATION_APPLY",
          ...(role === "ASSISTANT"
            ? []
            : ["CAMPAIGN_APPLICATION_WITHDRAW_PENDING" as const]),
        ],
      };
      const mapped = toCreatorWorkspaceActorContext(value, value.actor_user_id);
      expect(mapped?.subjectOwnerUserId).toBe("owner");
      expect(mapped?.actorUserId).toBe(value.actor_user_id);
      expect(mapped?.allowedActions).toEqual(value.allowed_actions);
      expect(
        toCreatorWorkspaceActorContext(
          { ...value, allowed_actions: ["UNKNOWN" as never] },
          value.actor_user_id,
        ),
      ).toBeNull();
      expect(toCreatorWorkspaceActorContext(value, "other")).toBeNull();
    },
  );
});
