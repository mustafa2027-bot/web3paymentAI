import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Web3Auth } from '@web3auth/modal';
import { CHAIN_NAMESPACES, IProvider } from '@web3auth/base';
import { ethers } from 'ethers';

// NOTE: Replace with your own Client ID from https://dashboard.web3auth.io
const clientId = "BPi5KC_u3L-n59UkU10_yVp_fc-8G5tt7buB8_gSmGFEtvx9c2aD4IZoVlR_9X_4ANjGsUeS79bF_BCYp_Jo-7g";

interface IWeb3AuthContext {
  provider: IProvider | null;
  account: string | null;
  chainId: string | null;
  isLoading: boolean; // For initial Web3Auth SDK setup
  isConnecting: boolean; // For the login process itself
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const Web3AuthContext = createContext<IWeb3AuthContext | null>(null);

export const useWeb3Auth = () => {
  const context = useContext(Web3AuthContext);
  if (!context) {
    throw new Error('useWeb3Auth must be used within a Web3AuthProvider');
  }
  return context;
};

export const Web3AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const web3authInstance = new Web3Auth({
          clientId,
          web3AuthNetwork: "sapphire_mainnet",
          chainConfig: {
            chainNamespace: CHAIN_NAMESPACES.EVM,
            chainId: "0xaa36a7", // Default to Sepolia
            rpcTarget: "https://rpc.sepolia.org",
            displayName: "Sepolia Testnet",
            blockExplorer: "https://sepolia.etherscan.io",
            ticker: "ETH",
            tickerName: "Sepolia Ether",
          },
        });

        await web3authInstance.initModal();
        setWeb3auth(web3authInstance);

        if (web3authInstance.status === 'connected') {
          setProvider(web3authInstance.provider);
        }
      } catch (error) {
        console.error("Web3Auth initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const getAccountAndChain = async () => {
      if (!provider) {
        setAccount(null);
        setChainId(null);
        return;
      }
      
      try {
        const ethersProvider = new ethers.BrowserProvider(provider);
        const signer = await ethersProvider.getSigner();
        const acc = await signer.getAddress();
        const network = await ethersProvider.getNetwork();
        
        setAccount(acc);
        setChainId(`0x${network.chainId.toString(16)}`);
      } catch (error) {
        console.error("Error getting account or chain info:", error);
        setAccount(null);
        setChainId(null);
      }
    };
    getAccountAndChain();
  }, [provider]);

  const login = async () => {
    if (!web3auth) {
        console.error("Web3Auth not initialized.");
        return;
    };
    setIsConnecting(true);
    try {
      const web3authProvider = await web3auth.connect();
      setProvider(web3authProvider);
    } catch(error) {
      console.error("Failed to connect with Web3Auth", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const logout = async () => {
    if (!web3auth) {
        console.error("Web3Auth not initialized.");
        return;
    }
    await web3auth.logout();
    setProvider(null);
  };
  
  // Subscribe to provider events to handle wallet changes
  useEffect(() => {
    if (provider) {
      const handleAccountsChanged = (accounts: string[]) => {
          if (accounts.length > 0) {
            setAccount(accounts[0])
          } else {
            // If user disconnects from wallet, treat as logout
            logout();
          };
      };
      const handleChainChanged = (_chainId: string) => {
          // It's often better to reload to avoid state inconsistencies
          window.location.reload();
      };

      provider.on('accountsChanged', handleAccountsChanged);
      provider.on('chainChanged', handleChainChanged);

      return () => {
          provider.removeListener('accountsChanged', handleAccountsChanged);
          provider.removeListener('chainChanged', handleChainChanged);
      }
    }
  }, [provider, logout]);


  const value = { provider, account, chainId, isLoading, isConnecting, login, logout };

  // FIX: The file was truncated, causing a syntax error on line 141. Completed the JSX tag and component definition.
  return (
    <Web3AuthContext.Provider value={value}>
      {children}
    </Web3AuthContext.Provider>
  );
};
