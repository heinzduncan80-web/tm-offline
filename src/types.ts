/**
 * Types representing the Technology Money (TM) state and profiles.
 */

export interface IidIdentity {
  iid: string;
  name: string;
  balance: number;
}

export interface Transaction {
  tx: string;
  from: string; // sender IID
  fromName: string;
  to: string; // receiver IID
  toName: string;
  amount: number;
  timestamp: string;
  hash: string;       // SHA256 simulation
  signature: string;  // ECDSA simulation
  status: 'PENDING' | 'SUCCESS' | 'SYNCED' | 'FAILED';
  deliveryMode: 'QR' | 'BLUETOOTH' | 'NETWORK';
}

export interface SystemState {
  internetOnline: boolean;
  bluetoothP2pRange: boolean;
  globalRegistry: { [iid: string]: { name: string; balance: number } };
  syncedTxIds: string[];
}
