import { Search, ChevronDown } from 'lucide-react';

const TopBar = () => {
  return (
    <header className="h-20 bg-[#F8F9FA] px-8 flex items-center justify-between sticky top-0 z-10">
      <div className="flex-1 flex items-center">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-[#D08B5B]" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#D08B5B] focus:border-[#D08B5B] sm:text-sm"
            placeholder="Ej: José, 012345678-9"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900 leading-tight">Ema PesoPluma69</p>
          <p className="text-xs text-gray-500">SV</p>
        </div>
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="h-10 w-10 rounded-full bg-gray-900"></div>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </div>
      </div>
    </header>
  );
};

export default TopBar;
