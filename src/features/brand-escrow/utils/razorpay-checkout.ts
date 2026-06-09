import { env } from "../../../shared/config/env";

type RazorpayHandlerResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayCheckoutInstance = {
  open: () => void;
  on: (event: string, handler: () => void) => void;
};

type RazorpayConstructor = new (options: {
  key: string;
  order_id: string;
  name: string;
  description: string;
  handler: (response: RazorpayHandlerResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
}) => RazorpayCheckoutInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

let scriptLoadPromise: Promise<void> | null = null;

function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) {
    return Promise.resolve();
  }
  if (scriptLoadPromise) {
    return scriptLoadPromise;
  }

  scriptLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Razorpay checkout.")),
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout."));
    document.body.appendChild(script);
  });

  return scriptLoadPromise;
}

export async function openRazorpayCheckout(input: {
  orderId: string;
  description: string;
  onSuccess: (response: RazorpayHandlerResponse) => void;
  onDismiss: () => void;
}): Promise<void> {
  const key = env.razorpayKeyId?.trim();
  if (!key) {
    throw new Error(
      "Razorpay is not configured for this environment (missing VITE_RAZORPAY_KEY_ID).",
    );
  }

  await loadRazorpayScript();
  if (!window.Razorpay) {
    throw new Error("Razorpay checkout is unavailable.");
  }

  const checkout = new window.Razorpay({
    key,
    order_id: input.orderId,
    name: "The Creator Shop",
    description: input.description,
    handler: input.onSuccess,
    modal: {
      ondismiss: input.onDismiss,
    },
  });

  checkout.open();
}
