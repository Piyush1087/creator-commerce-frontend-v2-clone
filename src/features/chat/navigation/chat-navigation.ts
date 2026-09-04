import {
  resolveBrandDestinationNavigation,
  UnsafeBrandDestinationError,
} from "../../auth/navigation/brand-destination-navigation";
import type { ChatGroundedResponse } from "../contracts/chat.schemas";

type ChatNavigation = NonNullable<ChatGroundedResponse["navigation"]>;

export class UnsafeChatNavigationError extends Error {
  constructor() {
    super("Creator Shop could not open that destination safely.");
    this.name = "UnsafeChatNavigationError";
  }
}

export function resolveChatNavigation(navigation: ChatNavigation): string {
  try {
    return resolveBrandDestinationNavigation(navigation);
  } catch (error) {
    if (error instanceof UnsafeBrandDestinationError) {
      throw new UnsafeChatNavigationError();
    }
    throw error;
  }
}
