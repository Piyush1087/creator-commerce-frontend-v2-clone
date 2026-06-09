export type EscrowTopUpMethod = "bank_wire" | "card";

export type EscrowLedgerEntry = {
  id: string;
  label: string;
  occurredAt: string;
  amount: number;
  currency: string;
  direction: "credit" | "debit";
  status?: string;
};

export type EscrowTopUpBreakdown = {
  allocation: number;
  gatewaySurcharge: number;
  surchargeGst: number;
  totalInvoiced: number;
};
