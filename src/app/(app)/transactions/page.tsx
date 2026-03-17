"use client";

import { Suspense } from "react";
import {
  TransactionsPageContent,
  TransactionsPageFallback,
} from "@/features/transactions/components/TransactionsPageContent";

export default function TransactionsPage() {
  return (
    <Suspense fallback={<TransactionsPageFallback />}>
      <TransactionsPageContent />
    </Suspense>
  );
}
