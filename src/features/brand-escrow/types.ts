export type EscrowTopUpMethod = "bank_wire" | "card";

export type EscrowLedgerEntry = {
  id: string;
  label: string;
  transactionType: string;
  occurredAt: string;
  amount: number;
  currency: string;
  direction: "credit" | "debit";
  status?: string;
  collaborationId: string | null;
  gatewayReferenceId: string | null;
  trancheTarget: string | null;
  contextLabel?: string;
};

export type EscrowTopUpBreakdown = {
  allocation: number;
  gatewaySurcharge: number;
  surchargeGst: number;
  totalInvoiced: number;
};
