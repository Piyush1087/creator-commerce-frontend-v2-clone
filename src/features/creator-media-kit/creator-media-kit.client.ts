import { authenticatedFetch } from "../../shared/api/authenticated-fetch";
import { env } from "../../shared/config/env";
import {
  creatorMediaKitSchema,
  mediaKitEmailSchema,
  mediaKitPdfSnapshotSchema,
  publicMediaKitSchema,
  verifiedMediaKitSchema,
  type CreatorMediaKit,
  type MediaKitPdfSnapshot,
  type PublicMediaKit,
  type VerifiedMediaKit,
} from "./creator-media-kit.contracts";

async function parsed<T>(
  response: Response,
  schema: { parse(value: unknown): T },
): Promise<T> {
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return schema.parse(await response.json());
}

export function readCreatorMediaKit(): Promise<CreatorMediaKit> {
  return authenticatedFetch(
    `${env.apiUrl}/api/v1/creator/media-kit?preview=VERIFIED`,
  ).then((response) => parsed(response, creatorMediaKitSchema));
}

export function mutateCreatorMediaKit(input: unknown) {
  return authenticatedFetch(`${env.apiUrl}/api/v1/creator/media-kit`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).then(async (response) => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json() as Promise<unknown>;
  });
}

export function creatorMediaKitPdf(): Promise<MediaKitPdfSnapshot> {
  return authenticatedFetch(`${env.apiUrl}/api/v1/creator/media-kit/pdf`, {
    method: "POST",
  }).then((response) => parsed(response, mediaKitPdfSnapshotSchema));
}

export function readPublicMediaKit(publicId: string): Promise<PublicMediaKit> {
  return fetch(
    `${env.apiUrl}/api/v1/public/media-kits/${encodeURIComponent(publicId)}`,
  ).then((response) => parsed(response, publicMediaKitSchema));
}

export function revealMediaKitEmail(publicId: string) {
  return fetch(
    `${env.apiUrl}/api/v1/public/media-kits/${encodeURIComponent(publicId)}/email`,
  ).then((response) => parsed(response, mediaKitEmailSchema));
}

export async function sendPublicMediaKitEvent(
  publicId: string,
  eventType:
    | "PUBLIC_THUMBNAIL_SOURCE_OPENED"
    | "WORK_WITH_CREATOR_CLICK"
    | "REVEAL_EMAIL_ID_CLICK",
) {
  try {
    await fetch(
      `${env.apiUrl}/api/v1/public/media-kits/${encodeURIComponent(publicId)}/events`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType }),
        keepalive: true,
      },
    );
  } catch {
    // Best-effort instrumentation never blocks the interaction.
  }
}

export function readVerifiedMediaKit(
  publicId: string,
): Promise<VerifiedMediaKit> {
  return authenticatedFetch(
    `${env.apiUrl}/api/v1/brand/media-kits/${encodeURIComponent(publicId)}`,
  ).then((response) => parsed(response, verifiedMediaKitSchema));
}

export function verifiedMediaKitPdf(
  publicId: string,
): Promise<MediaKitPdfSnapshot> {
  return authenticatedFetch(
    `${env.apiUrl}/api/v1/brand/media-kits/${encodeURIComponent(publicId)}/pdf`,
    { method: "POST" },
  ).then((response) => parsed(response, mediaKitPdfSnapshotSchema));
}
