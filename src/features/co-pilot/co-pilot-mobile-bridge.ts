import { AUTH_ROUTES } from "../auth/constants";

type OpenListener = () => void;

let openThreadDrawerListener: OpenListener | null = null;

export function isCoPilotDashboardPath(pathname: string): boolean {
  return pathname === AUTH_ROUTES.brandDashboard;
}

export function registerCoPilotThreadDrawer(listener: OpenListener): () => void {
  openThreadDrawerListener = listener;
  return () => {
    if (openThreadDrawerListener === listener) {
      openThreadDrawerListener = null;
    }
  };
}

export function openCoPilotThreadDrawer(): void {
  openThreadDrawerListener?.();
}
