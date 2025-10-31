import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3Auth } from './auth/Web3AuthContext';
import { type TransactionRecord } from './types';
import { SUPPORTED_CHAINS } from './config/chains';
import { generatePaymentMemo } from './services/geminiService';
import {
  WalletIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  SparkleIcon,
  ExternalLinkIcon,
  LogoutIcon,
  QuestionMarkCircleIcon,
} from './components/icons';
import { ChainSelector } from './components/ChainSelector';

// A utility to shorten addresses
const shortenAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

// Helper to convert an ETH string amount to wei BigInt for precision
const toWei = (ethAmount: string): bigint => ethers.parseEther(ethAmount);

interface ConfirmationDetails {
  recipient: string;
  amount: string;
  memo: string;
}

const ConfirmationDialog: React.FC<{
  details: ConfirmationDetails;
  onConfirm: () => void;
  onCancel: () => void;
  chainSymbol: string;
}> = ({ details, onConfirm, onCancel, chainSymbol }) => (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-sm">
            <div className="p-6">
                <div className="flex items-center justify-center mb-4">
                    <QuestionMarkCircleIcon className="w-12 h-12 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-center mb-2">Confirm Transaction</h3>
                <p className="text-sm text-gray-400 text-center mb-6">Please review the details below before sending.</p>
                
                <div className="space-y-4 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-400">To:</span>
                        <span className="font-mono text-indigo-300 truncate" title={details.recipient}>{shortenAddress(details.recipient)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Amount:</span>
                        <span className="font-semibold text-white">{details.amount} {chainSymbol}</span>
                    </div>
                    {details.memo && (
                        <div className="flex justify-between items-start gap-4">
                            <span className="text-gray-400 flex-shrink-0">Memo:</span>
                            <span className="text-gray-300 italic text-right break-words">"{details.memo}"</span>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="bg-gray-900/50 p-4 flex gap-4 rounded-b-xl">
                <button 
                    onClick={onCancel} 
                    className="w-full px-4 py-2 font-semibold text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                >
                    Cancel
                </button>
                <button 
                    onClick={onConfirm}
                    className="w-full px-4 py-2 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    Confirm & Send
                </button>
            </div>
        </div>
    </div>
);


const App: React.FC = () => {
  const { account, chainId, provider, login, logout, isConnecting, isLoading: isAuthLoading } = useWeb3Auth();

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [memoGenerationStatus, setMemoGenerationStatus] = useState({ isLoading: false, message: '' });

  const [txStatus, setTxStatus] = useState({
    sending: false,
    pendingHash: null as string | null,
    error: null as string | null,
    success: null as string | null,
  });

  const [transactionHistory, setTransactionHistory] = useState<TransactionRecord[]>([]);
  const [confirmationDetails, setConfirmationDetails] = useState<ConfirmationDetails | null>(null);

  const currentChain = SUPPORTED_CHAINS.find(chain => chain.chainId === chainId);
  const isTxLoading = txStatus.sending || !!txStatus.pendingHash;

  // Load transaction history from localStorage
  useEffect(() => {
    if (account && chainId) {
      try {
        const storedHistory = localStorage.getItem(`txHistory_${account}_${chainId}`);
        if (storedHistory) {
          setTransactionHistory(JSON.parse(storedHistory));
        } else {
          setTransactionHistory([]);
        }
      } catch (error) {
        console.error("Failed to parse transaction history:", error);
        setTransactionHistory([]);
      }
    }
  }, [account, chainId]);

  // Save transaction history to localStorage
  const saveTransaction = (newTx: TransactionRecord) => {
    if (!account || !chainId) return;
    const newHistory = [newTx, ...transactionHistory.slice(0, 4)];
    setTransactionHistory(newHistory);
    localStorage.setItem(`txHistory_${account}_${chainId}`, JSON.stringify(newHistory));
  };
  
  const switchChain = async (newChainId: string) => {
    if (!provider) return;
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: newChainId }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          const chainToAdd = SUPPORTED_CHAINS.find(c => c.chainId === newChainId);
          if (chainToAdd) {
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [{ ...chainToAdd, iconUrls: undefined }], // Some wallets don't support iconUrls
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
    setMemoGenerationStatus({ isLoading: true, message: 'Generating memo...' });
    try {
        const context = `A payment of ${amount} ${currentChain?.nativeCurrency.symbol || 'crypto'} to ${recipient}`;
        const generatedMemo = await generatePaymentMemo(context);
        setMemo(generatedMemo);
        setMemoGenerationStatus({ isLoading: false, message: 'Memo generated!' });
    } catch (error) {
        setMemoGenerationStatus({ isLoading: false, message: 'AI failed :(' });
        console.error(error);
    } finally {
        setTimeout(() => setMemoGenerationStatus({ isLoading: false, message: '' }), 2000);
    }
  };

  const handleSendTransaction = () => {
    if (!recipient || !amount || !account || !currentChain || !provider) {
      alert('Please fill in all fields and ensure your wallet is connected.');
      return;
    }
    // Set details for confirmation dialog instead of sending directly
    setConfirmationDetails({ recipient, amount, memo });
  };
  
  const executeTransaction = async () => {
    if (!confirmationDetails || !account || !currentChain || !provider) return;

    const { recipient, amount, memo } = confirmationDetails;
    setConfirmationDetails(null); // Close dialog

    setTxStatus({ sending: true, pendingHash: null, error: null, success: null });
    
    try {
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();

      const txParams = {
        to: recipient,
        value: toWei(amount),
        data: memo ? ethers.toUtf8Bytes(memo) : undefined,
      };

      const txResponse = await signer.sendTransaction(txParams);
      
      setTxStatus({ sending: false, pendingHash: txResponse.hash, error: null, success: null });

      await txResponse.wait(); // Wait for transaction to be mined

      const newTransaction: TransactionRecord = {
        hash: txResponse.hash,
        recipient,
        amount,
        memo,
      };
      saveTransaction(newTransaction);
      setTxStatus({ sending: false, pendingHash: null, error: null, success: `Transaction confirmed!` });
      setRecipient('');
      setAmount('');
      setMemo('');
    } catch (error: any) {
      const errorMessage = error?.info?.error?.message || error.message || "Transaction failed.";
      setTxStatus({ sending: false, pendingHash: null, error: errorMessage, success: null });
      console.error(error);
    } finally {
      setTimeout(() => setTxStatus(s => ({...s, success: null, error: null })), 5000);
    }
  };


  const renderTransactionStatus = () => {
    const { pendingHash, error, success } = txStatus;
    if (!pendingHash && !error && !success) return null;

    if (pendingHash) {
      return (
        <div className="p-3 mt-4 text-sm text-blue-300 bg-blue-900/50 rounded-lg border border-blue-800/50">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-3 animate-spin flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="font-semibold">Transaction Pending</span>
            {currentChain && (
              <a 
                href={`${currentChain.blockExplorerUrls[0]}/tx/${pendingHash}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="ml-auto underline hover:text-blue-200 flex items-center gap-1 text-xs"
                title="View on block explorer"
              >
                View Details
                <ExternalLinkIcon className="w-3 h-3" />
              </a>
            )}
          </div>
          <p className="mt-2 text-xs text-blue-400/80 text-center">
            Awaiting blockchain confirmation. This may take a moment depending on network traffic.
          </p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center p-3 mt-4 text-sm text-red-300 bg-red-900/50 rounded-lg">
          <ExclamationCircleIcon className="w-5 h-5 mr-3" />
          <p className="flex-1 break-words">{error}</p>
        </div>
      );
    }

    if (success) {
      return (
        <div className="flex items-center p-3 mt-4 text-sm text-green-300 bg-green-900/50 rounded-lg">
          <CheckCircleIcon className="w-5 h-5 mr-3" />
          {success}
        </div>
      );
    }

    return null;
  };

  const renderSendButtonContent = () => {
    if (txStatus.sending) {
      return (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Sending...
        </>
      );
    }
    if (txStatus.pendingHash) {
      return (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Mining...
        </>
      );
    }
    return 'Send';
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center py-10 px-4 font-mono">
        {confirmationDetails && (
            <ConfirmationDialog 
                details={confirmationDetails}
                onConfirm={executeTransaction}
                onCancel={() => setConfirmationDetails(null)}
                chainSymbol={currentChain?.nativeCurrency.symbol || ''}
            />
        )}
        <div className="w-full max-w-md mx-auto">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-indigo-400">CryptoPay AI</h1>
                {account ? (
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center bg-gray-800 p-2 rounded-lg">
                            <WalletIcon className="w-5 h-5 mr-2 text-indigo-400" />
                            <span title={account}>{shortenAddress(account)}</span>
                        </div>
                        <button onClick={logout} className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors" title="Logout">
                            <LogoutIcon className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                    <button 
                      onClick={login} 
                      disabled={isConnecting || isAuthLoading}
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-colors disabled:bg-gray-600 disabled:cursor-wait"
                    >
                        {isConnecting || isAuthLoading ? 'Loading...' : 'Login'}
                    </button>
                )}
            </header>
            
            <main className="bg-gray-800/50 border border-gray-700 p-6 rounded-xl shadow-lg">
                {!account ? (
                    <div className="text-center text-gray-400">
                        <p>Please login to get started.</p>
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
                                Unsupported network. Please switch to a supported network.
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
                                disabled={!currentChain || isTxLoading}
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
                                disabled={!currentChain || isTxLoading}
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
                                    placeholder={memoGenerationStatus.message || "For the pizza..."}
                                    className="flex-grow px-3 py-2 text-white bg-gray-900/50 border border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 placeholder:italic"
                                    disabled={!currentChain || isTxLoading}
                                />
                                <button 
                                    type="button" 
                                    onClick={handleGenerateMemo}
                                    className="p-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                                    disabled={!currentChain || isTxLoading || memoGenerationStatus.isLoading || !recipient || !amount}
                                >
                                    <SparkleIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <button 
                            type="submit"
                            className="w-full flex justify-center items-center px-4 py-3 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed transition-colors"
                            disabled={!currentChain || isTxLoading || !recipient || !amount}
                        >
                            {renderSendButtonContent()}
                        </button>
                    </form>
                )}

                {renderTransactionStatus()}
            </main>

            {account && transactionHistory.length > 0 && currentChain && (
                <section className="mt-8">
                    <h3 className="text-lg font-semibold mb-4 text-gray-300">Recent Transactions</h3>
                    <div className="space-y-3">
                        {transactionHistory.map((tx) => (
                           <div key={tx.hash} className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg flex justify-between items-start gap-4">
                               <div className="flex-1 min-w-0">
                                   <p className="font-medium text-sm truncate" title={tx.recipient}>To: {shortenAddress(tx.recipient)}</p>
                                   <p className="text-sm text-gray-400">Amount: {tx.amount} {currentChain.nativeCurrency.symbol}</p>
                                   {tx.memo && <p className="text-sm text-gray-400 italic truncate" title={tx.memo}>"{tx.memo}"</p>}
                               </div>
                               <a 
                                 href={`${currentChain.blockExplorerUrls[0]}/tx/${tx.hash}`}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="text-indigo-400 hover:text-indigo-300 text-xs font-mono flex items-center gap-1"
                                 title={tx.hash}
                                >
                                    {shortenAddress(tx.hash)}
                                    <ExternalLinkIcon className="w-4 h-4" />
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