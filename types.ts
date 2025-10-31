// FIX: Import React to make React.FC available.
import React from 'react';

export interface TransactionStatus {
  isLoading: boolean;
  error: string | null;
  success: string | null;
}

export interface TransactionRecord {
  hash: string;
  recipient: string;
  amount: string;
  memo?: string;
}

export interface Chain {
  chainId: string; // Hex
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
  icon: React.FC<{ className?: string }>;
}
