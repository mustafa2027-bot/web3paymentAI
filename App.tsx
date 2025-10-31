import React, { useState, useEffect, useCallback } from 'react';
import { ethers, BrowserProvider } from 'ethers';
import { type Chain, type TransactionStatus, type TransactionRecord } from './types';
import { SUPPORTED_CHAINS } from './config/chains';
import { generatePaymentMemo } from './services/geminiService';
import {
  WalletIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  SparkleIcon,
  ExternalLinkIcon,
} from './components/icons';
import { ChainSelector } from './components/ChainSelector';

// A utility to shorten addresses
const shortenAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

const App: React.FC = () => {
  const [currentAccount, setCurrentAccount] = useState<string | null>(null);
  const [currentChainId, setCurrentChainId] = useState<string | null>(null);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>({
    isLoading: false,
    error: null,
    success: null,
  });
  const [transactionHistory, setTransactionHistory] = useState<TransactionRecord[]>([]);

  const currentChain = SUPPORTED_CHAINS.find(chain => chain.chainId === currentChainId);

  const checkIfWalletIsConnected = useCallback(async () => {
    try {
      const { ethereum } = window as any;
      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      }

      const provider = new BrowserProvider(ethereum);
      const accounts = await provider.listAccounts();

      if (accounts.length > 0) {
        const account = accounts[0];
        setCurrentAccount(account.address);
        
        const network = await provider.getNetwork();
        setCurrentChainId('0x' + network.chainId.toString(16));
      } else {
        console.log("No authorized account found");
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    checkIfWalletIsConnected();

    const { ethereum } = window as any;
    if (ethereum) {
        const handleAccountsChanged = (accounts: string[]) => {
            if (accounts.length > 0) {
                setCurrentAccount(accounts[0]);
            } else {
                setCurrentAccount(null);
            }
        };
        const handleChainChanged = (chainId: string) => {
            // Per EIP-1193, it's recommended to reload the page on chain change
            window.location.reload();
        };

        ethereum.on('accountsChanged', handleAccountsChanged);
        ethereum.on('chainChanged', handleChainChanged);

        return () => {
            ethereum.removeListener('accountsChanged', handleAccountsChanged);
            ethereum.removeListener('chainChanged', handleChainChanged);
        }
    }
  }, [checkIfWalletIsConnected]);
  
  const connectWallet = async () => {
    try {
      const { ethereum } = window as any;
      if (!ethereum) {
        setTransactionStatus({ isLoading: false, error: "MetaMask not found. Please install the extension.", success: null });
        return;
      }
      const provider = new BrowserProvider(ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.error(error);
      setTransactionStatus({ isLoading: false, error: "Failed to connect wallet.", success: null });
    }
  };
  
  const switchChain = async (chainId: string) => {
    const { ethereum } = window as any;
    if (!ethereum) return;
    
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        try {
          const chainToAdd = SUPPORTED_CHAINS.find(c => c.chainId === chainId);
          if (chainToAdd) {
            await ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: chainToAdd.chainId,
                  chainName: chainToAdd.chainName,
                  nativeCurrency: chainToAdd.nativeCurrency,
                  rpcUrls: chainToAdd.rpcUrls,
                  blockExplorerUrls: chainToAdd.blockExplorerUrls,
                },
              ],
            });
          }
        } catch (addError) {
           console.error('Failed to add chain', addError);
        }
      } else {
        console.error('Failed to switch chain', switchError);
      }
    }
  };

  const handleGenerateMemo = async () => {
    if (!recipient || !amount) {
        alert('Please fill in recipient and amount first to provide context for the memo.');
        return;
    }
    setTransactionStatus({ isLoading: true, error: null, success: 'Generating memo...' });
    try {
        const context = `A payment of ${amount} ${currentChain?.nativeCurrency.symbol || 'crypto'} to ${recipient}`;
        const generatedMemo = await generatePaymentMemo(context);
        setMemo(generatedMemo);
        setTransactionStatus({ isLoading: false, error: null, success: 'Memo generated!' });
        setTimeout(() => setTransactionStatus({ isLoading: false, error: null, success: null }), 2000);
    } catch (error) {
        setTransactionStatus({ isLoading: false, error: 'Failed to generate memo.', success: null });
        console.error(error);
    }
  };

  const handleSendTransaction = async () => {
    if (!recipient || !amount) {
        alert('Please fill in all fields.');
        return;
    }

    if (!currentAccount || !currentChain) {
        alert('Please connect your wallet and select a supported network.');
        return;
    }
    
    setTransactionStatus({ isLoading: true, error: null, success: null });
    
    try {
        const { ethereum } = window as any;
        if (!ethereum) throw new Error("No crypto wallet found");

        const provider = new BrowserProvider(ethereum);
        const signer = await provider.getSigner();
        
        const memoHex = memo ? ethers.hexlify(new TextEncoder().encode(memo)) : '0x';

        const txParams = {
            to: recipient,
            value: ethers.parseEther(amount),
            data: memoHex,
        };

        const tx = await signer.sendTransaction(txParams);

        const newTransaction: TransactionRecord = {
            hash: tx.hash,
            recipient,
            amount,
            memo,
        };
        setTransactionHistory(prev => [newTransaction, ...prev]);
        setTransactionStatus({ isLoading: false, error: null, success: `Transaction sent!` });
        setRecipient('');
        setAmount('');
        setMemo('');

    } catch (error: any) {
        const errorMessage = error.info?.error?.message || error.message || "Transaction failed.";
        setTransactionStatus({ isLoading: false, error: errorMessage, success: null });
        console.error(error);
    }
  };

  const renderTransactionStatus = () => {
    const { isLoading, error, success } = transactionStatus;
    if (!isLoading && !error && !success) return null;
    
    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-3 mt-4 text-sm text-blue-300 bg-blue-900/50 rounded-lg">
                 <svg className="w-5 h-5 mr-3 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center p-3 mt-4 text-sm text-red-300 bg-red-900/50 rounded-lg">
                <ExclamationCircleIcon className="w-5 h-5 mr-3" />
                {error}
            </div>
        );
    }

    if (success) {
        return (
            <div className="flex items-center p-3 mt-4 text-sm text-green-300 bg-green-900/50 rounded-lg">
                <CheckCircleIcon className="w-5 h-5 mr-3" />
                {success}
            </div>
        )
    }

    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center py-10 px-4 font-mono">
        <div className="w-full max-w-md mx-auto">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-indigo-400">Web3 PayWave</h1>
                {currentAccount ? (
                    <div className="flex items-center bg-gray-800 p-2 rounded-lg">
                         <WalletIcon className="w-5 h-5 mr-2 text-indigo-400" />
                         <span>{shortenAddress(currentAccount)}</span>
                    </div>
                ) : (
                    <button onClick={connectWallet} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-colors">
                        Connect Wallet
                    </button>
                )}
            </header>
            
            <main className="bg-gray-800/50 border border-gray-700 p-6 rounded-xl shadow-lg">
                {!currentAccount ? (
                    <div className="text-center text-gray-400">
                        <p>Please connect your wallet to get started.</p>
                    </div>
                ) : (
                    <form onSubmit={(e) => { e.preventDefault(); handleSendTransaction(); }} className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Send Payment</h2>
                            <ChainSelector 
                                currentChain={currentChain} 
                                supportedChains={SUPPORTED_CHAINS}
                                onSwitchChain={switchChain} 
                            />
                        </div>

                        {!currentChain && (
                            <div className="p-3 text-sm text-yellow-300 bg-yellow-900/50 rounded-lg">
                                Unsupported network. Please switch to a supported network from your wallet.
                            </div>
                        )}

                        <div>
                            <label htmlFor="recipient" className="block text-sm font-medium text-gray-400 mb-1">Recipient Address</label>
                            <input
                                id="recipient"
                                type="text"
                                value={recipient}
                                onChange={(e) => setRecipient(e.target.value)}
                                placeholder="0x..."
                                className="w-full px-3 py-2 text-white bg-gray-900/50 border border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                required
                                disabled={!currentChain}
                            />
                        </div>
                        
                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-gray-400 mb-1">Amount</label>
                            <input
                                id="amount"
                                type="text"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                                placeholder="0.0"
                                className="w-full px-3 py-2 text-white bg-gray-900/50 border border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                required
                                disabled={!currentChain}
                            />
                        </div>

                        <div>
                            <label htmlFor="memo" className="block text-sm font-medium text-gray-400 mb-1">Memo (Optional)</label>
                            <div className="flex items-center space-x-2">
                                <input
                                    id="memo"
                                    type="text"
                                    value={memo}
                                    onChange={(e) => setMemo(e.target.value)}
                                    placeholder="For the pizza..."
                                    className="flex-grow px-3 py-2 text-white bg-gray-900/50 border border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                    disabled={!currentChain || transactionStatus.isLoading}
                                />
                                <button 
                                    type="button" 
                                    onClick={handleGenerateMemo}
                                    className="p-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                                    disabled={!currentChain || transactionStatus.isLoading || !recipient || !amount}
                                >
                                    <SparkleIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <button 
                            type="submit"
                            className="w-full px-4 py-3 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                            disabled={!currentChain || transactionStatus.isLoading || !recipient || !amount}
                        >
                            Send
                        </button>
                    </form>
                )}

                {renderTransactionStatus()}
            </main>

            {transactionHistory.length > 0 && currentChain && (
                <section className="mt-8">
                    <h3 className="text-lg font-semibold mb-4 text-gray-300">Transaction History</h3>
                    <div className="space-y-3">
                        {transactionHistory.map((tx) => (
                           <div key={tx.hash} className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg flex justify-between items-center">
                               <div>
                                   <p className="font-medium">To: {shortenAddress(tx.recipient)}</p>
                                   <p className="text-sm text-gray-400">Amount: {tx.amount} {currentChain?.nativeCurrency.symbol}</p>
                                   {tx.memo && <p className="text-sm text-gray-400 italic">"{tx.memo}"</p>}
                               </div>
                               <a 
                                 href={`${currentChain.blockExplorerUrls[0]}/tx/${tx.hash}`}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="text-indigo-400 hover:text-indigo-300"
                                >
                                    <ExternalLinkIcon className="w-5 h-5" />
                                </a>
                           </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    </div>
  );
};

export default App;