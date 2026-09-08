'use client';

import { createContext, useContext } from 'react';

const AccountIdentity = createContext('');
export function AccountIdentityProvider({ initial, children }: { initial: string; children: React.ReactNode }) {
  return <AccountIdentity.Provider value={initial}>{children}</AccountIdentity.Provider>;
}
export function useAccountInitial() { return useContext(AccountIdentity); }
