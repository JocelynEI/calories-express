import React, { createContext, PropsWithChildren, useCallback, useContext, useMemo, useState } from 'react';
import { PremiumModal } from '../components/PremiumModal';
import { PremiumFeature } from '../domain/premium';

type PaywallValue = { openPaywall: (feature?: PremiumFeature) => void };

const PaywallContext = createContext<PaywallValue | null>(null);

/**
 * V5.0 — un seul écran du premium pour toute l'application.
 *
 * N'importe quel écran appelle `openPaywall('bilans')` quand on touche une
 * fonction verrouillée ; l'écran s'ouvre par-dessus, et rien d'autre ne change.
 */
export function PaywallProvider({ children }: PropsWithChildren) {
  const [open, setOpen] = useState<{ feature?: PremiumFeature } | null>(null);
  const openPaywall = useCallback((feature?: PremiumFeature) => setOpen({ feature }), []);
  const value = useMemo(() => ({ openPaywall }), [openPaywall]);
  return (
    <PaywallContext.Provider value={value}>
      {children}
      {open && <PremiumModal feature={open.feature} onClose={() => setOpen(null)} />}
    </PaywallContext.Provider>
  );
}

export const usePaywall = () => {
  const context = useContext(PaywallContext);
  if (!context) throw new Error('usePaywall must be used inside PaywallProvider');
  return context;
};
