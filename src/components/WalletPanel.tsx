import React from 'react';

interface WalletPanelProps {
  ryo: number;
}

const WalletPanel: React.FC<WalletPanelProps> = ({ ryo }) => {
  return (
    <div className="mt-auto pt-3 border-t border-zinc-800">
      <div className="flex justify-between text-sm items-center">
        <span className="text-zinc-500 text-[10px] uppercase tracking-wider">Wallet</span>
        <span className="text-yellow-500 font-mono font-bold">
          {ryo} <span className="text-[10px] text-zinc-600">Ryō</span>
        </span>
      </div>
    </div>
  );
};

export default WalletPanel;
