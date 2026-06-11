type RazorpaySubscriptionHandlerResponse = {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
};

type RazorpaySubscriptionCheckoutInstance = {
  open: () => void;
  on: (event: string, handler: () => void) => void;
};

type RazorpaySubscriptionConstructor = new (options: {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  handler: (response: RazorpaySubscriptionHandlerResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
}) => RazorpaySubscriptionCheckoutInstance;

function getRazorpaySubscriptionConstructor(): RazorpaySubscriptionConstructor | undefined {
  return (window as Window & { Razorpay?: RazorpaySubscriptionConstructor }).Razorpay;
}

let scriptLoadPromise: Promise<void> | null = null;

function loadRazorpayScript(): Promise<void> {
  if (getRazorpaySubscriptionConstructor()) {
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

export async function openRazorpaySubscriptionCheckout(input: {
  subscriptionId: string;
  razorpayKeyId: string;
  description: string;
  onSuccess: (response: RazorpaySubscriptionHandlerResponse) => void;
  onDismiss: () => void;
}): Promise<void> {
  const key = input.razorpayKeyId.trim();
  if (!key) {
    throw new Error("Razorpay is not configured for subscription checkout.");
  }

  await loadRazorpayScript();
  const Razorpay = getRazorpaySubscriptionConstructor();
  if (!Razorpay) {
    throw new Error("Razorpay checkout is unavailable.");
  }

  const checkout = new Razorpay({
    key,
    subscription_id: input.subscriptionId,
    name: "The Creator Shop",
    description: input.description,
    handler: input.onSuccess,
    modal: {
      ondismiss: input.onDismiss,
    },
  });

  checkout.open();
}
