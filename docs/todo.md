1. MUI components (due to prompt in gemini.md)
2. Font on landing page is not satoshi
3. Animation has not come in because ai studio didn't have it. Can you pull it from stitch directly later?

product doc vs real code comparisionfe and be 

Verify Brand Onboarding ttl  
Image fetch  
Pipeline setup      
  
save login for week

planner next cmapaign in ui

Refresh in Tab 1 logic  

Check uindustry wise product template in Tab 1  

User has no password   

brand center:  

- Edit in Tab1

Instagram and meat ad bosst will come in laterin tab 1  

check if cron set up for brand center midnight refresh  

OTP template  

Communication  
Telemetry  
Admin  
PWA  

Create campaign adds uk and usa by deafult for loaction, veirfy this, tyhis field not in ui on create  

get new logo  

Universla no netwrk error page?  

in cneter tab 2 i see loading when already done  
in tab 2 on click should move to tab 3  

campaiugn not active until atleat one product assigned , show error in ui  

discouss product inventory, currently set as 50 by default, is this tracking needed?  

does AI Always create escrpw?    

rzorpay webhook secret needs to be updated  

JWT login TTL  

razorpay all or nothing transaction, as we saw, payment top up done bu8t balcnec not chnage if 3rd webhppk fails  
Invoice generation api  

monthly plan status check  

features prom,ised under each plan  

featires blocks om plan expiry  

razropay beneficiary  

**Is “all or nothing” taken care of?**

**Partially, on the server — not fully in the UX.**

**What we do have (good):**

- **Idempotency key** on top-up intent — avoids double-charging on retries.
- **Ledger row first** in `PROCESSING_GATEWAY` — pending state is explicit.
- **Webhook clears once** — won’t double-credit if the same event is replayed (we check `CLEARED`).
- **Failed payments** can mark ledger `FAILED` via `payment.failed`.
- **Razorpay capture** — money is only “really” taken when authorized + captured (we added auto-capture on `payment.authorized`).

**What we don’t have (gap vs your expectation):**

- Frontend **success modal too early** — it treats “checkout finished” as “top-up cleared,” which is misleading.
- **No polling** after payment — if webhook is slow or fails, user is stuck on `PROCESSING_GATEWAY`.
- **No reconciliation job** — if webhook never arrives, payment can succeed at Razorpay but escrow never credits.
- **Network drop** between checkout and webhook — Razorpay may have the money; your app might not know yet.

So: **backend logic is directionally correct; the product promise is ahead of what we confirm.**

---

## **What “correct” looks like (industry standard)**

You **cannot** make the whole flow one DB transaction with Razorpay in the middle. The correct pattern is:

### **1. Three clear states for the user**


| **State**   | **User message**                           |
| ----------- | ------------------------------------------ |
| **Pending** | “Payment received — confirming with bank…” |
| **Cleared** | “Top-up complete — balance updated”        |
| **Failed**  | “Payment failed — no money added”          |


Never show **“Top-up cleared”** until backend says `CLEARED` and balance matches.

### **2. Source of truth**

- **Razorpay** = payment authorized/captured/failed.
- **Your ledger + vault balances** = escrow credited (only after webhook or verified API poll).

Razorpay does **not** update your escrow balance. **You** must, from webhooks or by fetching payment/order status from Razorpay API.

### **3. Webhooks + safety net**

- **Primary:** webhooks (`payment.captured`, `order.paid`, etc.).
- **Backup:** poll Razorpay order/payment status for rows stuck in `PROCESSING_GATEWAY` for X minutes.
- **Last resort:** nightly reconciliation (Razorpay settlements vs your ledger).

### **4. Idempotency everywhere**

- Same payment / same webhook delivered twice → credit **once** (you already lean this way).
- User retries top-up → new order, new ledger row, or same idempotency key returns same intent.

### **5. Error messages**


| **Situation**                | **Correct UX**                                                       |
| ---------------------------- | -------------------------------------------------------------------- |
| User closes Razorpay         | “Payment cancelled — no charge”                                      |
| Card declined                | Razorpay shows error; webhook → `FAILED`                             |
| Checkout OK, webhook pending | “Confirming payment…” (not “Done”)                                   |
| Checkout OK, webhook failed  | “Payment may have gone through — we’re retrying” + support/reconcile |
| Webhook OK                   | “Top-up complete” + show new balance                                 |


Razorpay shows **card-level** errors in checkout. **Escrow balance** errors are **your** responsibility — Razorpay won’t say “escrow balance updated.”  

Check priciing docs gaps doc   

razorpay webhooks for prod