import React from 'react';
import { Wifi, WifiOff, Bluetooth, Send, Database, RefreshCw, Radio, CheckCircle2 } from 'lucide-react';
import { Transaction } from '../types';

interface NetworkControlPanelProps {
  internetOnline: boolean;
  onToggleInternet: () => void;
  bluetoothP2pRange: boolean;
  onToggleBluetooth: () => void;
  transactions: Transaction[];
  onTriggerSync: () => void;
  isSyncing: boolean;
  onResetDemo: () => void;
  lang?: 'ID' | 'EN';
}

export default function NetworkControlPanel({
  internetOnline,
  onToggleInternet,
  bluetoothP2pRange,
  onToggleBluetooth,
  transactions,
  onTriggerSync,
  isSyncing,
  onResetDemo,
  lang = 'ID'
}: NetworkControlPanelProps) {
  
  const pendingSyncCount = transactions.filter(t => t.status === 'SUCCESS').length;
  const syncedTransactions = transactions.filter(t => t.status === 'SYNCED');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl text-slate-100">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-850 pb-4 mb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-400 animate-pulse" />
            <h2 className="text-lg font-bold font-sans tracking-tight text-white">
              {lang === 'ID' ? 'Pengendali Sinkronisasi Otonom Neurosphere' : 'Neurosphere Autonomous Sync Controller'}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {lang === 'ID' 
              ? 'Simulasikan lingkungan fisik & periksa sinkronisasi global hasil transaksi offline.'
              : 'Simulate localized workspace conditions & orchestrate off-grid peer ledger synchronizations.'}
          </p>
        </div>
        
        <div className="flex gap-2.5 w-full md:w-auto">
          <button
            onClick={onResetDemo}
            className="flex-1 md:flex-initial px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 rounded-lg text-xs font-semibold border border-slate-750 transition-colors shadow-sm cursor-pointer"
            id="reset-demo-button"
          >
            {lang === 'ID' ? 'Reset Demo Swadaya' : 'Reset Simulation'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* PHYSICAL RADIO CONTROLLERS */}
        <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold font-sans text-slate-300 uppercase tracking-wider mb-3">
              {lang === 'ID' ? '1. Simulasi Saluran Radio' : '1. Local Wireless Radios'}
            </h3>
            
            {/* WIFI INTERNET ROUTER STATE */}
            <div className="flex items-center justify-between mb-4 bg-slate-900 p-3 rounded-lg border border-slate-800">
              <div className="flex items-center gap-2.5">
                {internetOnline ? (
                  <Wifi className="w-5 h-5 text-emerald-400 animate-pulse" />
                ) : (
                  <WifiOff className="w-5 h-5 text-rose-500 animate-pulse" />
                )}
                <div>
                  <div className="text-xs font-bold">{lang === 'ID' ? 'Koneksi Internet' : 'Internet Ingress'}</div>
                  <div className="text-[10px] text-slate-450 font-mono">
                    {internetOnline ? "sync.neurosphere.world" : (lang === 'ID' ? "Sinyal Terputus" : "Off-grid Mode")}
                  </div>
                </div>
              </div>
              <button
                onClick={onToggleInternet}
                className={`text-[10px] font-bold px-2.5 py-1.5 rounded uppercase tracking-wider transition-colors cursor-pointer ${
                  internetOnline 
                    ? 'bg-rose-950/50 hover:bg-rose-900 border border-rose-800 text-rose-450' 
                    : 'bg-emerald-950/50 hover:bg-emerald-900 border border-emerald-800 text-emerald-400'
                }`}
                id="toggle-internet-btn"
              >
                {internetOnline 
                  ? (lang === 'ID' ? "Matikan" : "Disconnect") 
                  : (lang === 'ID' ? "Hidupkan" : "Connect")}
              </button>
            </div>

            {/* BLUETOOTH PROPAGATION STATE */}
            <div className="flex items-center justify-between bg-slate-900 p-3 rounded-lg border border-slate-800">
              <div className="flex items-center gap-2.5">
                <Bluetooth className={`w-5 h-5 ${bluetoothP2pRange ? 'text-blue-400 animate-pulse' : 'text-slate-650'}`} />
                <div>
                  <div className="text-xs font-bold">{lang === 'ID' ? 'Jarak Bluetooth' : 'Bluetooth Proximity'}</div>
                  <div className="text-[10px] text-slate-455 font-mono">
                    {bluetoothP2pRange 
                      ? (lang === 'ID' ? "Dekat (< 10 Meter)" : "Within Range (< 10m)") 
                      : (lang === 'ID' ? "Sangat Jauh" : "Out of range")}
                  </div>
                </div>
              </div>
              <button
                onClick={onToggleBluetooth}
                className={`text-[10px] font-bold px-2.5 py-1.5 rounded uppercase tracking-wider transition-colors cursor-pointer ${
                  bluetoothP2pRange 
                    ? 'bg-amber-955/40 hover:bg-amber-900 border border-amber-800 text-amber-400' 
                    : 'bg-blue-955/40 hover:bg-blue-900 border border-blue-800 text-blue-400'
                }`}
                id="toggle-bluetooth-btn"
              >
                {bluetoothP2pRange 
                  ? (lang === 'ID' ? "Jauhkan" : "Separate") 
                  : (lang === 'ID' ? "Dekatkan" : "Bring Closer")}
              </button>
            </div>
          </div>
          
          <p className="text-[10.5px] text-slate-500 mt-3 leading-snug">
            {lang === 'ID' 
              ? '*Matikan internet untuk menguji sirkulasi saldo 100% offline via QR Code / Bluetooth!' 
              : '*Disconnect internet to test 100% autonomous transaction ledger via QR / Bluetooth P2P!'}
          </p>
        </div>

        {/* CLOUD LEDGER VERIFICATION */}
        <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold font-sans text-slate-300 uppercase tracking-wider">
                {lang === 'ID' ? '2. Sinkronisasi Awan global' : '2. Global Registry Cloud'}
              </h3>
              <span className={`h-2 w-2 rounded-full ${internetOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></span>
            </div>
            
            <p className="text-xs text-slate-405 mb-4 leading-normal">
              {lang === 'ID' 
                ? 'Pusat registrasi blockchain global untuk validasi akhir sirkulasi kas offline.'
                : 'Central blockchain catalog resolving double-spending records once connection re-establishes.'}
            </p>

            <div className="space-y-2 font-mono text-xs text-slate-305 text-left">
              <div className="flex justify-between border-b border-slate-900 pb-1">
                <span className="text-slate-505">{lang === 'ID' ? 'Status Server:' : 'Server Reachability:'}</span>
                <span className={internetOnline ? "text-emerald-400 font-bold" : "text-amber-500"}>
                  {internetOnline ? "REACHABLE" : "UNREACHABLE"}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-1">
                <span className="text-slate-505">{lang === 'ID' ? 'Belum Sinkron:' : 'Awaiting Push:'}</span>
                <span className={pendingSyncCount > 0 ? "text-amber-500 font-bold" : "text-slate-400"}>
                  {pendingSyncCount} {lang === 'ID' ? 'Transaksi' : 'TX Payload(s)'}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-1">
                <span className="text-slate-505">{lang === 'ID' ? 'Telah Verifikasi:' : 'Online Verified:'}</span>
                <span className="text-indigo-450 font-bold">
                  {syncedTransactions.length} {lang === 'ID' ? 'Transaksi' : 'TX Record(s)'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={onTriggerSync}
              disabled={!internetOnline || pendingSyncCount === 0 || isSyncing}
              className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                !internetOnline 
                  ? 'bg-slate-800 text-slate-550 cursor-not-allowed border border-slate-850'
                  : pendingSyncCount === 0
                  ? 'bg-slate-900 text-slate-400 border border-slate-800 cursor-not-allowed'
                  : 'bg-indigo-650 hover:bg-indigo-600 border border-indigo-500 text-white animate-pulse'
              }`}
              id="sync-ledger-button"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing 
                ? (lang === 'ID' ? "Mengunggah..." : "Synchronizing...") 
                : (lang === 'ID' ? "Sinkronisasi Sekarang" : "Push Local Cache Online")}
            </button>
          </div>
        </div>

        {/* SOVEREIGN LEDGER EXPLORER */}
        <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold font-sans text-slate-300 uppercase tracking-wider mb-2">
              {lang === 'ID' ? '3. Histori SQLite Cloud Server' : '3. Distributed Ledger Streams'}
            </h3>
            <p className="text-xs text-slate-400 mb-3 leading-normal">
              {lang === 'ID' 
                ? 'Membuktikan kebebasan transaksi peer-to-peer tanpa pusat basis data tunggal.'
                : 'Proving absolute off-grid P2P double-spending mitigation before committing cloud registry logs.'}
            </p>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {transactions.length === 0 ? (
                <div className="text-center py-6 text-slate-600 text-xs font-mono">
                  {lang === 'ID' ? 'Belum ada transaksi tersimpan di server cloud.' : 'Cloud explorer database registry is empty.'}
                </div>
              ) : (
                transactions.map((tx, idx) => (
                  <div key={tx.tx} className="bg-slate-900/80 border border-slate-850 p-2 rounded-lg text-[10px] font-mono leading-tight">
                    <div className="flex justify-between text-indigo-455 font-bold mb-1">
                      <span>{tx.tx}</span>
                      <span className={tx.status === 'SYNCED' ? 'text-emerald-400 font-bold' : 'text-amber-500'}>
                        {tx.status}
                      </span>
                    </div>
                    <div className="text-slate-300">
                      IID Send: {tx.fromName.split(' ')[1] || tx.fromName} → {tx.toName.split(' ')[1] || tx.toName}
                    </div>
                    <div className="text-slate-400 font-bold mt-0.5">
                      {lang === 'ID' ? 'Nominal:' : 'Amount:'} Rp {tx.amount.toLocaleString('id-ID')}
                    </div>
                    <div className="text-[8px] text-slate-500 truncate mt-1">
                      Signature Verified: {tx.signature.substring(0, 16)}...
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[9.5px] text-indigo-400/80 pt-2 border-t border-slate-900/60 font-sans leading-snug">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
            <span>
              {lang === 'ID' 
                ? 'Keamanan mutlak terjamin kode sandi ECDSA otonom.' 
                : 'Absolute cryptographic validation secured via ECDSA signatures.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
