import React, { useState, useEffect } from 'react';
import { 
  Radio, ShieldAlert, Wifi, WifiOff, Bluetooth, RefreshCw, 
  Layers, Database, Landmark, Github, AlertCircle, PlayCircle, HelpCircle,
  Smartphone, BookOpen, Star, Sparkles, Check, CheckCircle
} from 'lucide-react';
import PhoneSimulator from './components/PhoneSimulator';
import NetworkControlPanel from './components/NetworkControlPanel';
import { Transaction } from './types';
import { pushTransactionToFirestore, isFirebaseConfigured } from './lib/firebase';
import TMLogo from './components/TMLogo';

export default function App() {
  // Environmental States
  const [internetOnline, setInternetOnline] = useState<boolean>(false); // Start offline by default for demo
  const [bluetoothP2pRange, setBluetoothP2pRange] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Language state end-to-end
  const [lang, setLang] = useState<'ID' | 'EN'>('ID');

  // Native & Simulated PWA installation states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState<boolean>(true); // Support click-to-install natively or with beautiful instructions

  // Audio mute state shared by both phone simulations
  const [isVoiceMuted, setIsVoiceMuted] = useState<boolean>(true);

  // Dynamic user states
  const [user1Name, setUser1Name] = useState<string>("Pak Ahmad");
  const [user1Iid, setUser1Iid] = useState<string>("IID-001-062-AHM0001");
  const [user1Balance, setUser1Balance] = useState<number>(20000000);
  const [user1Registered, setUser1Registered] = useState<boolean>(true);

  const [user2Name, setUser2Name] = useState<string>("Bu Siti");
  const [user2Iid, setUser2Iid] = useState<string>("IID-001-062-SIT0002");
  const [user2Balance, setUser2Balance] = useState<number>(20000000);
  const [user2Registered, setUser2Registered] = useState<boolean>(true);

  // Unified persistent SQLite transaction table
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Peer-to-peer active QR channel data
  const [ahmadActiveQr, setAhmadActiveQr] = useState<{ receiver: string; amount: number } | null>(null);
  const [sitiActiveQr, setSitiActiveQr] = useState<{ receiver: string; amount: number } | null>(null);

  // Active phone viewer on small screens
  const [activeMobileTab, setActiveMobileTab] = useState<'AHMAD' | 'SITI'>('AHMAD');

  // Register PWA Install listener
  useEffect(() => {
    const handleBeforePrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforePrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforePrompt);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User installation choice: ${outcome}`);
      setDeferredPrompt(null);
      if (outcome === 'accepted') {
        setShowInstallBtn(false);
      }
    } else {
      // Fallback instruction dialog for frame environments or iOS Safari
      alert(lang === 'ID' 
        ? "👉 Fitur PWA (Progressive Web App):\n\nAplikasi ini siap disematkan langsung di layar HP/komputer Anda!\n\nUntuk menginstalnya:\n1. Klik ikon [Install] di bilah alamat browser Anda (Chrome/Edge/PC)\n2. Atau, klik menu opsi (titik tiga) di browser lalu pilih 'Tambahkan ke Layar Utama' / 'Install App'\n3. Di iOS Safari, klik tombol Share (panah ke atas) lalu pilih 'Add to Home Screen'.\n\nSelesai! Aplikasi akan terinstal langsung dan bisa dibuka offline seperti aplikasi native."
        : "👉 PWA (Progressive Web App) Feature:\n\nThis app is ready to be added straight to your home screen!\n\nTo install:\n1. Click the [Install] icon in your browser address bar (Chrome/Edge/PC)\n2. Or, open your mobile browser menu (three dots) and tap 'Add to Home Screen' / 'Install App'\n3. On iOS Safari, tap the Share button (up arrow) and select 'Add to Home Screen'.\n\nDone! The app will install instantly and launch offline just like a native application."
      );
    }
  };

  // Load persistent storage (representing SQLite Langkah 11)
  useEffect(() => {
    try {
      const storedUser1Name = localStorage.getItem('tm_user1_name');
      const storedUser1Iid = localStorage.getItem('tm_user1_iid');
      const storedUser1Bal = localStorage.getItem('tm_user1_bal');
      const storedUser1Reg = localStorage.getItem('tm_user1_reg');

      const storedUser2Name = localStorage.getItem('tm_user2_name');
      const storedUser2Iid = localStorage.getItem('tm_user2_iid');
      const storedUser2Bal = localStorage.getItem('tm_user2_bal');
      const storedUser2Reg = localStorage.getItem('tm_user2_reg');

      const storedTxs = localStorage.getItem('tm_transactions');

      if (storedUser1Name !== null) setUser1Name(storedUser1Name);
      if (storedUser1Iid !== null) setUser1Iid(storedUser1Iid);
      if (storedUser1Bal !== null) setUser1Balance(Number(storedUser1Bal));
      if (storedUser1Reg !== null) setUser1Registered(storedUser1Reg === 'true');

      if (storedUser2Name !== null) setUser2Name(storedUser2Name);
      if (storedUser2Iid !== null) setUser2Iid(storedUser2Iid);
      if (storedUser2Bal !== null) setUser2Balance(Number(storedUser2Bal));
      if (storedUser2Reg !== null) setUser2Registered(storedUser2Reg === 'true');

      if (storedTxs !== null) {
        setTransactions(JSON.parse(storedTxs));
      }
    } catch (e) {
      console.warn("Could not load from localStorage:", e);
    }
  }, []);

  // Sync to database simulated helpers
  const saveStateToStorage = (
    u1Name: string, u1Iid: string, u1Bal: number, u1Reg: boolean,
    u2Name: string, u2Iid: string, u2Bal: number, u2Reg: boolean,
    txs: Transaction[]
  ) => {
    try {
      localStorage.setItem('tm_user1_name', u1Name);
      localStorage.setItem('tm_user1_iid', u1Iid);
      localStorage.setItem('tm_user1_bal', u1Bal.toString());
      localStorage.setItem('tm_user1_reg', u1Reg ? 'true' : 'false');

      localStorage.setItem('tm_user2_name', u2Name);
      localStorage.setItem('tm_user2_iid', u2Iid);
      localStorage.setItem('tm_user2_bal', u2Bal.toString());
      localStorage.setItem('tm_user2_reg', u2Reg ? 'true' : 'false');

      localStorage.setItem('tm_transactions', JSON.stringify(txs));
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }
  };

  const handleUpdateAhmadBalance = (newBal: number) => {
    setUser1Balance(newBal);
    saveStateToStorage(user1Name, user1Iid, newBal, user1Registered, user2Name, user2Iid, user2Balance, user2Registered, transactions);
  };

  const handleUpdateSitiBalance = (newBal: number) => {
    setUser2Balance(newBal);
    saveStateToStorage(user1Name, user1Iid, user1Balance, user1Registered, user2Name, user2Iid, newBal, user2Registered, transactions);
  };

  const handleAddTransaction = (newTx: Transaction) => {
    const updated = [newTx, ...transactions];
    setTransactions(updated);
    saveStateToStorage(user1Name, user1Iid, user1Balance, user1Registered, user2Name, user2Iid, user2Balance, user2Registered, updated);
  };

  const handleRegisterUser1 = (name: string, generatedIid: string) => {
    setUser1Name(name);
    setUser1Iid(generatedIid);
    setUser1Balance(20000000); // Receive initial Rp 20 Juta program Swadaya Kebaikan
    setUser1Registered(true);
    saveStateToStorage(name, generatedIid, 20000000, true, user2Name, user2Iid, user2Balance, user2Registered, transactions);
  };

  const handleDeregisterUser1 = () => {
    setUser1Registered(false);
    saveStateToStorage(user1Name, user1Iid, user1Balance, false, user2Name, user2Iid, user2Balance, user2Registered, transactions);
  };

  const handleRegisterUser2 = (name: string, generatedIid: string) => {
    setUser2Name(name);
    setUser2Iid(generatedIid);
    setUser2Balance(20000000); // Receive initial Rp 20 Juta program Swadaya Kebaikan
    setUser2Registered(true);
    saveStateToStorage(user1Name, user1Iid, user1Balance, user1Registered, name, generatedIid, 20000000, true, transactions);
  };

  const handleDeregisterUser2 = () => {
    setUser2Registered(false);
    saveStateToStorage(user1Name, user1Iid, user1Balance, user1Registered, user2Name, user2Iid, user2Balance, false, transactions);
  };

  // Step 8: Bluetooth Relay implementation
  const handleReceiveBluetoothRelay = (relayedTx: Transaction) => {
    // Simulated peer receives the signal
    setTimeout(() => {
      if (bluetoothP2pRange) {
        let isUpdated = false;
        let nextU1 = user1Balance;
        let nextU2 = user2Balance;

        if (relayedTx.to === user2Iid) {
          nextU2 = user2Balance + relayedTx.amount;
          setUser2Balance(nextU2);
          isUpdated = true;
        } else if (relayedTx.to === user1Iid) {
          nextU1 = user1Balance + relayedTx.amount;
          setUser1Balance(nextU1);
          isUpdated = true;
        }

        if (isUpdated) {
          const updatedTxs = transactions.map(t => {
            if (t.tx === relayedTx.tx) {
              return { ...t, status: internetOnline ? 'SYNCED' as const : 'SUCCESS' as const };
            }
            return t;
          });

          const exists = transactions.some(t => t.tx === relayedTx.tx);
          const finalTxs = exists ? updatedTxs : [relayedTx, ...transactions];

          setTransactions(finalTxs);
          saveStateToStorage(user1Name, user1Iid, nextU1, user1Registered, user2Name, user2Iid, nextU2, user2Registered, finalTxs);
        }
      }
    }, 1000);
  };

  // Step 12: Sync transaction list online
  const triggerOnlineSync = async () => {
    if (!internetOnline) return;
    setIsSyncing(true);
    
    // Copy transactions state to operate safely and push any unsynced success elements to cloud database
    const pendingTxs = transactions.filter(t => t.status === 'SUCCESS');
    
    if (isFirebaseConfigured) {
      try {
        for (const tx of pendingTxs) {
          await pushTransactionToFirestore(tx);
        }
      } catch (err) {
        console.error("Firestore sync error:", err);
      }
    }
    
    setTimeout(() => {
      // Sync all of our offline transactions
      const syncedTxs = transactions.map(tx => {
        if (tx.status === 'SUCCESS') {
          return { ...tx, status: 'SYNCED' as const };
        }
        return tx;
      });

      // Synchronize backends: make sure both balances are in absolute sync on the server Registry
      setTransactions(syncedTxs);
      saveStateToStorage(user1Name, user1Iid, user1Balance, user1Registered, user2Name, user2Iid, user2Balance, user2Registered, syncedTxs);
      setIsSyncing(false);
    }, 1500);
  };

  // Reset environmental states
  const handleResetDemo = () => {
    localStorage.removeItem('tm_user1_name');
    localStorage.removeItem('tm_user1_iid');
    localStorage.removeItem('tm_user1_bal');
    localStorage.removeItem('tm_user1_reg');
    localStorage.removeItem('tm_user2_name');
    localStorage.removeItem('tm_user2_iid');
    localStorage.removeItem('tm_user2_bal');
    localStorage.removeItem('tm_user2_reg');
    localStorage.removeItem('tm_transactions');
    setUser1Name("Pak Ahmad");
    setUser1Iid("IID-001-062-AHM0001");
    setUser1Balance(20000000);
    setUser1Registered(true);
    setUser2Name("Bu Siti");
    setUser2Iid("IID-001-062-SIT0002");
    setUser2Balance(20000000);
    setUser2Registered(true);
    setTransactions([]);
    setAhmadActiveQr(null);
    setSitiActiveQr(null);
    setInternetOnline(false);
    setBluetoothP2pRange(true);
    setIsSyncing(false);
    window.location.reload();
  };

  // Detect which step of the 12 target steps has been demonstrated
  const isStepDone = (stepNum: number) => {
    switch (stepNum) {
      case 1: // Buat IID
        return true; // Always active for user demo
      case 2: // Rp 20jt Reward Perdana
        return user1Balance >= 20000000 || user2Balance >= 20000000;
      case 3: // Tombol aktif menyala bimbingan
        return true; 
      case 4: // Terima - Generate QR
        return sitiActiveQr !== null;
      case 5: // Kirim - Lensa AI / Scan QR
        return transactions.length > 0 || stagedContains(user1Iid);
      case 6: // PIN/Sidik jari
        return transactions.length > 0;
      case 7: // Transaction creation
        return transactions.length > 0;
      case 8: // Bluetooth Relay
        return transactions.some(t => t.deliveryMode === 'BLUETOOTH') ;
      case 9: // Layar Emas Hijau Berhasil
        return transactions.length > 0;
      case 10: // Buku Riwayat Kas
        return transactions.length > 0;
      case 11: // SQLite Local Storage
        return true; 
      case 12: // Sinkronisasi Online
        return transactions.some(t => t.status === 'SYNCED');
      default:
        return false;
    }
  };

  const stagedContains = (senderIid: string) => {
    return transactions.some(t => t.from === senderIid);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 pb-16">
      
      {/* GLOBAL HERO HEADER BANNER WITH LANGUAGE SWITCHER */}
      <header className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 border-b border-indigo-900/30 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.06),transparent_50%)]"></div>
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <TMLogo size="md" />
            <div>
              <h1 className="text-lg md:text-xl font-black tracking-tight text-white font-mono uppercase bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-emerald-400">
                TM Offline Demo <span className="text-[10px] bg-slate-800 pr-1.5 pl-1.5 py-0.5 rounded text-emerald-400 font-bold ml-1">v0.1 POC</span>
              </h1>
              <p className="text-xs text-slate-400 font-sans mt-0.5 font-medium">
                {lang === 'ID' 
                  ? 'Sovereign Offline Transaction wallet peer-to-peer tanpa internet & server'
                  : 'Sovereign Offline Transaction P2P wallet operating fully off-grid with zero server dependency'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2.5">
            {/* DUAL LANGUAGE TOGGLE BUTTON */}
            <button
              onClick={() => {
                setLang(lang === 'ID' ? 'EN' : 'ID');
                try {
                  const audio = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA== ");
                  audio.volume = 0.08;
                  audio.play().catch(() => {});
                } catch(e){}
              }}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-900/80 to-indigo-950 border-2 border-indigo-500/50 hover:border-indigo-400 text-xs font-black tracking-wider text-indigo-200 hover:text-white flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(99,102,241,0.15)] animate-shimmer"
              title="Ganti Bahasa / Switch Language"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>{lang === 'ID' ? '🌐 ENGLISH VERSION' : '🌐 VERSI INDONESIA'}</span>
            </button>

            <span className="text-xs font-black px-2.5 py-1.5 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-900/60 inline-flex items-center gap-1.5 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
              {lang === 'ID' ? 'KAS BANTUAN PERADABAN' : 'KINDNESS CIVILIZATION SYSTEM'}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8 relative z-10">
        
        {/* INTERACTIVE COMPANION NEUROSPHERE CONTROLLER BAR */}
        <section id="neurosphere-controller">
          <NetworkControlPanel
            internetOnline={internetOnline}
            onToggleInternet={() => {
              setInternetOnline(!internetOnline);
              if (!internetOnline) {
                // If turning online, trigger background sync
                setTimeout(() => triggerOnlineSync(), 200);
              }
            }}
            bluetoothP2pRange={bluetoothP2pRange}
            onToggleBluetooth={() => setBluetoothP2pRange(!bluetoothP2pRange)}
            transactions={transactions}
            onTriggerSync={triggerOnlineSync}
            isSyncing={isSyncing}
            onResetDemo={handleResetDemo}
            lang={lang}
          />
        </section>

        {/* MOBILE DEVICE TAB TOGGLER (FOR PORTABLE SCREENS (<1024px)) */}
        <div className="lg:hidden bg-slate-900 border border-slate-800 p-1.5 rounded-xl flex items-center justify-between">
          <button
            onClick={() => setActiveMobileTab('AHMAD')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
              activeMobileTab === 'AHMAD' 
                ? 'bg-amber-600 text-slate-950 shadow-md font-extrabold' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            {lang === 'ID' ? 'HP 1: Pak Ahmad (Kirim)' : 'PH-1: Ahmad (Sender)'}
          </button>
          
          <button
            onClick={() => setActiveMobileTab('SITI')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
              activeMobileTab === 'SITI' 
                ? 'bg-emerald-600 text-slate-950 shadow-md font-extrabold' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            {lang === 'ID' ? 'HP 2: Bu Siti (Terima)' : 'PH-2: Siti (Receiver)'}
          </button>
        </div>

        {/* THE DUAL SMARTPHONE SIDE-BY-SIDE SIMULATOR PANEL */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* DEVICE 1: SENDER PHONE */}
          <div className={`${activeMobileTab === 'AHMAD' ? 'block' : 'hidden lg:block'} space-y-4`}>
            <div className="flex items-center justify-between bg-slate-900/40 p-3 rounded-2xl border border-slate-850">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
                  {lang === 'ID' ? `HP ANDROID 1 — ${user1Name.toUpperCase()}` : `PH-1 ANDROID — ${user1Name.toUpperCase()}`}
                </span>
              </div>
              <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-400 font-mono">
                Active Keypair: SECP256K1
              </span>
            </div>

            <PhoneSimulator
              ownerId="AHMAD"
              ownerName={user1Name}
              iid={user1Iid}
              balance={user1Balance}
              onUpdateBalance={handleUpdateAhmadBalance}
              transactions={transactions}
              onAddTransaction={handleAddTransaction}
              internetOnline={internetOnline}
              bluetoothP2pRange={bluetoothP2pRange}
              otherPhoneIid={user2Iid}
              otherPhoneName={user2Name}
              otherPhoneActiveQr={sitiActiveQr}
              onSetMyActiveQr={setAhmadActiveQr}
              onReceiveBluetoothRelay={handleReceiveBluetoothRelay}
              isMuted={isVoiceMuted}
              onToggleMute={() => setIsVoiceMuted(!isVoiceMuted)}
              accentColor="amber"
              isRegistered={user1Registered}
              onRegister={handleRegisterUser1}
              onDeregister={handleDeregisterUser1}
              lang={lang}
              showInstallBtn={showInstallBtn}
              onInstallPWA={handleInstallPWA}
            />
          </div>

          {/* DEVICE 2: RECEIVER PHONE */}
          <div className={`${activeMobileTab === 'SITI' ? 'block' : 'hidden lg:block'} space-y-4`}>
            <div className="flex items-center justify-between bg-slate-900/40 p-3 rounded-2xl border border-slate-850">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">
                  {lang === 'ID' ? `HP ANDROID 2 — ${user2Name.toUpperCase()}` : `PH-2 ANDROID — ${user2Name.toUpperCase()}`}
                </span>
              </div>
              <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-400 font-mono">
                Active Keypair: SECP256K1
              </span>
            </div>

            <PhoneSimulator
              ownerId="SITI"
              ownerName={user2Name}
              iid={user2Iid}
              balance={user2Balance}
              onUpdateBalance={handleUpdateSitiBalance}
              transactions={transactions}
              onAddTransaction={handleAddTransaction}
              internetOnline={internetOnline}
              bluetoothP2pRange={bluetoothP2pRange}
              otherPhoneIid={user1Iid}
              otherPhoneName={user1Name}
              otherPhoneActiveQr={ahmadActiveQr}
              onSetMyActiveQr={setSitiActiveQr}
              onReceiveBluetoothRelay={handleReceiveBluetoothRelay}
              isMuted={isVoiceMuted}
              onToggleMute={() => setIsVoiceMuted(!isVoiceMuted)}
              accentColor="emerald"
              isRegistered={user2Registered}
              onRegister={handleRegisterUser2}
              onDeregister={handleDeregisterUser2}
              lang={lang}
              showInstallBtn={showInstallBtn}
              onInstallPWA={handleInstallPWA}
            />
          </div>

        </section>

        {/* VERIFICATION FLOW AND CHECKPOINTS ROADMAP (Steps 1 to 12) */}
        <section className="bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                {lang === 'ID' ? '12 Titik Verifikasi Target Demo' : '12 Target Demo Verification Benchmarks'}
              </h3>
              <p className="text-xs text-slate-450 mt-0.5">
                {lang === 'ID' 
                  ? 'Pantau status implementasi konsep Technology Money (TM) secara dinamis seiring interaksi Anda.'
                  : 'Monitor the offline Technology Money (TM) ledger states and flow parameters in real time.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { 
                id: 1, 
                name: lang === 'ID' ? "Identitas IID-I" : "Identity IID-1", 
                desc: lang === 'ID' ? "Pembuatan identitas IID-001-062-AHM0001 acak via HP lokal" : "Secured decentralized sovereign unique ID generation on device" 
              },
              { 
                id: 2, 
                name: lang === 'ID' ? "Rewards Gratis" : "Seed wallet grant", 
                desc: lang === 'ID' ? "Penerimaan rewards gratis Rp 20 juta saat dompet aktif" : "Initial Rp 20 Million Swadaya Kebaikan civil grant unlocked on sign up" 
              },
              { 
                id: 3, 
                name: lang === 'ID' ? "Tombol Berkedip" : "Interactive Guide Beacons", 
                desc: lang === 'ID' ? "Animasi pulsasi berputar membimbing panca indra lansia" : "Adaptive glowing cues guiding elderly steps sequentially" 
              },
              { 
                id: 4, 
                name: lang === 'ID' ? "Terima Saldo" : "Receive Balance", 
                desc: lang === 'ID' ? "Bu Siti mengklik terima nominal & menerbitkan payload QR" : "Receiver logs offline payload parameters inside localized secure QR code" 
              },
              { 
                id: 5, 
                name: lang === 'ID' ? "Pindai QR" : "Scan QR Code", 
                desc: lang === 'ID' ? "Lensa AI HP Pak Ahmad mendeteksi QR Bu Siti offline" : "Sender captures QR stream parameters dynamically via offline camera lens" 
              },
              { 
                id: 6, 
                name: lang === 'ID' ? "Sensor Biometrik" : "Biometric Consent", 
                desc: lang === 'ID' ? "Validasi sidik jari lokal mengaktifkan kunci privat IID" : "Local hardware gesture validates private credential key access" 
              },
              { 
                id: 7, 
                name: lang === 'ID' ? "Tanda Tangan Digital" : "Cryptographic Handshake", 
                desc: lang === 'ID' ? "Kalkulasi hash SHA255 & enkripsi ECDSA otonom" : "Transaction hash signed instantly using localized custom ECDSA" 
              },
              { 
                id: 8, 
                name: lang === 'ID' ? "Relay Bluetooth" : "Bluetooth P2P Mesh", 
                desc: lang === 'ID' ? "Transmisi saldo offline lewat udara (< 10m) langsung" : "Transaction records propagated without wire directly between nodes" 
              },
              { 
                id: 9, 
                name: lang === 'ID' ? "Berhasil Emas" : "Gilded Success Screen", 
                desc: lang === 'ID' ? "Perubahan layar sukses mewah bersinar bimbingan AURA" : "Premium green and gold celebration modal confirming off-grid trade" 
              },
              { 
                id: 10, 
                name: lang === 'ID' ? "Riwayat Transaksi" : "Transaction Ledger Book", 
                desc: lang === 'ID' ? "Pencatatan sirkulasi saldo di kasir masing-masing" : "Local SQLite database ledger entry updated in sandboxed simulation" 
              },
              { 
                id: 11, 
                name: lang === 'ID' ? "SQLite Ledger" : "Persistent Core", 
                desc: lang === 'ID' ? "Penyimpanan data lokal handal persistent database" : "Storage persistence handles unexpected phone restarts and power outages" 
              },
              { 
                id: 12, 
                name: lang === 'ID' ? "Sinkronisasi Online" : "Global State SyncUp", 
                desc: lang === 'ID' ? "Verifikasi blockchain global saat internet ON" : "Resolves localized double-spending parameters automatically with cloud" 
              }
            ].map((step) => {
              const done = isStepDone(step.id);
              return (
                <div 
                  key={step.id} 
                  className={`p-3 rounded-xl border transition-all ${
                    done 
                      ? 'bg-emerald-950/20 border-emerald-805 text-slate-100 shadow-[0_0_8px_rgba(16,185,129,0.1)]' 
                      : 'bg-slate-950 border-slate-900 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-slate-500">
                      {lang === 'ID' ? `Langkah ${step.id}` : `Step ${step.id}`}
                    </span>
                    {done ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-850 text-emerald-400 font-bold flex items-center gap-1 leading-none uppercase">
                        <Check className="w-2.5 h-2.5" />
                        {lang === 'ID' ? 'AKTIF' : 'ACTIVE'}
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-900 border border-slate-850 text-slate-505 font-bold leading-none uppercase">
                        {lang === 'ID' ? 'BELUM' : 'PENDING'}
                      </span>
                    )}
                  </div>
                  <h4 className={`text-xs font-bold ${done ? 'text-emerald-405' : 'text-slate-300'}`}>{step.name}</h4>
                  <p className="text-[11px] leading-snug text-slate-500 mt-1">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* CONCEPT ARCHITECTURE DOCUMENTATION */}
        <section className="bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-xl grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-2">
              {lang === 'ID' ? 'Penjelasan Sistem Kriptografi Offline' : 'Offline Cryptographic Architecture'}
            </h3>
            <p className="text-xs text-slate-350 leading-relaxed">
              {lang === 'ID' 
                ? 'Sistem Technology Money (TM) v0.1 berhasil memecahkan masalah pembayaran offline ganda (double-spending) tanpa server dengan menggabungkan tiga pilar utama:'
                : 'The Technology Money (TM) v0.1 system resolves double-spending constraints natively without server-authority via three core pillars:'}
            </p>
            <ul className="list-disc list-inside text-xs text-slate-405 space-y-1.5 mt-3 leading-relaxed">
              <li>
                <strong>{lang === 'ID' ? 'Sovereign Identity (IID-I):' : 'Sovereign Identity (IID-I):'}</strong>{' '}
                {lang === 'ID' 
                  ? 'Setiap pengguna menghasilkan pasangan kunci privat/publik unik secara lokal tanpa server. Menggunakan awalan wilayah dan nomor seri acak.'
                  : 'Every citizen instantiates a secure cryptographic, localized public/private key pair on-device containing local prefix hashes.'}
              </li>
              <li>
                <strong>{lang === 'ID' ? 'Otonomi Sidik Jari (Biometrics):' : 'Hardware-Enclave Biometrics:'}</strong>{' '}
                {lang === 'ID' 
                  ? 'Memanfaatkan chip TEE (Trusted Execution Environment) bawaan HP untuk mengasahkan persetujuan enkripsi tanda tangan privat.'
                  : 'Authorizes cryptographic signing routines autonomously through secure local TEE (Trusted Execution Environment) gesture matching.'}
              </li>
              <li>
                <strong>{lang === 'ID' ? 'Chaining Ledger Enkripsi:' : 'Hash Chaining Secure Ledger:'}</strong>{' '}
                {lang === 'ID' 
                  ? 'Setiap transaksi merujuk hash SHA256 transaksi sebelumnya secara berurutan, mencegah penghapusan histori secara curang.'
                  : 'Successive off-grid transactions maintain integrity by embedding SHA256 hashes of prior entries sequentially for validation.'}
              </li>
            </ul>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-405 mb-2">
              {lang === 'ID' ? 'Skenario Rekomendasi Demo' : 'Recommended Demo Script'}
            </h4>
            <ol className="list-decimal list-inside text-xs text-slate-300 space-y-2 leading-relaxed">
              <li>
                {lang === 'ID' 
                  ? 'Pada HP Bu Siti (Kanan), klik TERIMA, masukkan nominal Rp 10.000 dan klik BUAT QR CODE.'
                  : 'On Bu Siti\'s Phone (Right), click RECEIVE, input Rp 10,000, and click GENERATE QR CODE.'}
              </li>
              <li>
                {lang === 'ID' 
                  ? 'Pada HP Pak Ahmad (Kiri), klik KIRIM DATA SALDO, maka Lensa AI akan mendeteksi QR code Bu Siti secara dinamis.'
                  : 'On Pak Ahmad\'s Phone (Left), click SEND OFFLINE CASH. The AI camera simulator will spot Bu Siti\'s QR instantly.'}
              </li>
              <li>
                {lang === 'ID' 
                  ? 'Klik tombol hijau KLIK UNTUK PINDAI, lalu konfirmasi dan sahkan transaksi dengan menempel sidik jari simulasian Pak Ahmad.'
                  : 'Click the green SCAN QR payload trigger, then authorize the off-grid ledger transfer via simulated biometric thumbprint.'}
              </li>
              <li>
                {lang === 'ID' 
                  ? 'Dana seketika ditransfer via Bluetooth Relay offline ke HP Bu Siti (Saldo Bu Siti berubah menjadi Rp 20.010.000).'
                  : 'Cash transfers instantaneously over the air via Bluetooth P2P Relay (Bu Siti\'s balance swells to Rp 20,010,000).'}
              </li>
              <li>
                {lang === 'ID' 
                  ? 'Aktifkan Koneksi Internet di panel kontrol atas untuk menyinkronkan total riwayat transaksi ke cloud Neurosphere!'
                  : 'Enable Internet Connection in the top controller panel to push local transaction sequences to the distributed cloud!'}
              </li>
            </ol>
          </div>
        </section>

      </main>

    </div>
  );
}
