import React, { useState, useRef, useEffect } from 'react';
import { type Chain } from '../types';
import { ChevronDownIcon } from './icons';

interface ChainSelectorProps {
  currentChain: Chain | undefined;
  supportedChains: Chain[];
  onSwitchChain: (chainId: string) => void;
}

export const ChainSelector: React.FC<ChainSelectorProps> = ({ currentChain, supportedChains, onSwitchChain }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentChain) {
    return <div className="h-10 w-32 bg-gray-700 rounded-lg animate-pulse" />;
  }
  
  const { icon: Icon } = currentChain;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-white bg-gray-700/50 border border-gray-600 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-colors"
      >
        <div className="flex items-center">
            <Icon className="w-5 h-5 mr-2" />
            <span>{currentChain.chainName}</span>
        </div>
        <ChevronDownIcon className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 w-full mt-2 origin-top-right bg-gray-800 border border-gray-700 divide-y divide-gray-700 rounded-lg shadow-lg z-10">
          <div className="py-1">
            {supportedChains.map((chain) => (
              <button
                key={chain.chainId}
                onClick={() => {
                  onSwitchChain(chain.chainId);
                  setIsOpen(false);
                }}
                disabled={chain.chainId === currentChain.chainId}
                className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-default"
              >
                <chain.icon className="w-5 h-5 mr-3" />
                {chain.chainName}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
