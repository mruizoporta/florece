"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

type SalonMoneyContextValue = {
  currencySymbol: string;
  formatMoney: (amount?: number | null) => string;
};

const SalonMoneyContext = createContext<SalonMoneyContextValue>({
  currencySymbol: "C$",
  formatMoney: (amount) => formatCurrency(amount, "C$"),
});

export function SalonMoneyProvider({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  const [currencySymbol, setCurrencySymbol] = useState("C$");

  useEffect(() => {
    api<{ setting?: { currencySymbol?: string | null } }>("/v1/settings", {
      tenantSlug: slug,
      auth: true,
    })
      .then((data) => {
        const symbol = data.setting?.currencySymbol?.trim();
        if (symbol) setCurrencySymbol(symbol);
      })
      .catch(() => {
        /* keep default */
      });
  }, [slug]);

  const formatMoney = useCallback(
    (amount?: number | null) => formatCurrency(amount, currencySymbol),
    [currencySymbol],
  );

  const value = useMemo(
    () => ({ currencySymbol, formatMoney }),
    [currencySymbol, formatMoney],
  );

  return (
    <SalonMoneyContext.Provider value={value}>
      {children}
    </SalonMoneyContext.Provider>
  );
}

export function useSalonMoney() {
  return useContext(SalonMoneyContext);
}
