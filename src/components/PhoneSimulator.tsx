import React, { useState, useEffect } from 'react';
import { 
  Smartphone, Wifi, WifiOff, Bluetooth, QrCode, Fingerprint, 
  CheckCircle2, Clock, ArrowUpRight, ArrowDownLeft, X, Shield, Lock, 
  Sparkles, RotateCcw, AlertTriangle, Send, Landmark, Coins, HelpCircle, FileText
} from 'lucide-react';
import { Transaction } from '../types';
import { calculateSHA256, generateEcdsaSignature } from '../utils/crypto';
import QrCodeCanvas from './QrCodeCanvas';
import AuraAiTutor from './AuraAiTutor';
import TMLogo from './TMLogo';
import { jsPDF } from 'jspdf';

interface PhoneSimulatorProps {
  ownerId: string; // "AHM0001" or "SIT0002"
  ownerName: string; // "Pak Ahmad" or "Bu Siti"
  iid: string; // "IID-001-062-AHM0001" or "IID-001-062-SIT0002"
  balance: number;
  onUpdateBalance: (newBalance: number) => void;
  transactions: Transaction[];
  onAddTransaction: (tx: Transaction) => void;
  internetOnline: boolean;
  bluetoothP2pRange: boolean;
  
  // Shared peer state for dynamic connection simulation
  otherPhoneIid: string;
  otherPhoneName: string;
  otherPhoneActiveQr: { receiver: string; amount: number } | null;
  onSetMyActiveQr: (qr: { receiver: string; amount: number } | null) => void;
  onReceiveBluetoothRelay: (tx: Transaction) => void;

  isMuted: boolean;
  onToggleMute: () => void;
  accentColor: 'emerald' | 'amber';

  // Dynamic user registration props
  isRegistered: boolean;
  onRegister: (name: string, iid: string) => void;
  onDeregister: () => void;

  // New multi-language & PWA properties
  lang: 'ID' | 'EN';
  showInstallBtn?: boolean;
  onInstallPWA?: () => void;
}

type ScreenMode = 'DASHBOARD' | 'TERIMA' | 'KIRIM_SCAN' | 'KIRIM_CONFIRM' | 'BIOMETRIC_AUTH' | 'SUCCESS' | 'RIWAYAT' | 'AURA_CHAT' | 'REGISTRATION' | 'REGISTRATION_SUCCESS';

export default function PhoneSimulator({
  ownerId,
  ownerName,
  iid,
  balance,
  onUpdateBalance,
  transactions,
  onAddTransaction,
  internetOnline,
  bluetoothP2pRange,
  otherPhoneIid,
  otherPhoneName,
  otherPhoneActiveQr,
  onSetMyActiveQr,
  onReceiveBluetoothRelay,
  isMuted,
  onToggleMute,
  accentColor,
  isRegistered,
  onRegister,
  onDeregister,
  lang,
  showInstallBtn = false,
  onInstallPWA
}: PhoneSimulatorProps) {
  // App navigation state
  const [screen, setScreen] = useState<ScreenMode>(isRegistered ? 'DASHBOARD' : 'REGISTRATION');
  const [auraMessage, setAuraMessage] = useState<string>('Selamat datang di Technology Money. Rewards Gratis Rp 20 juta telah ditambahkan.');
  const [auraVoice, setAuraVoice] = useState<string>('Selamat datang di Technology Money. Rewards Gratis Rp dua puluh juta telah ditambahkan.');
  const [auraStepLabel, setAuraStepLabel] = useState<string>('Akun Aktif');

  // Input states
  const [inputAmount, setInputAmount] = useState<number>(10000); // Default Rp 10.000 for PoC
  const [activeQrValueString, setActiveQrValueString] = useState<string>('');
  
  // Scanned transaction staging
  const [stagedTx, setStagedTx] = useState<{
    receiverIid: string;
    receiverName: string;
    amount: number;
  } | null>(null);

  // Verification locks
  const [isProcessingBiometric, setIsProcessingBiometric] = useState<boolean>(false);
  const [biometricSuccess, setBiometricSuccess] = useState<boolean>(false);
  const [lastCompletedTx, setLastCompletedTx] = useState<Transaction | null>(null);

  // Custom AURA AI chat support for seniors
  const [chatInput, setChatInput] = useState<string>('');
  const [chatReply, setChatReply] = useState<string>('');

  // Registration input states
  const [regName, setRegName] = useState<string>('');
  const [regRegion, setRegRegion] = useState<string>('062');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regPin, setRegPin] = useState<string>('1234');
  const [isRegLoading, setIsRegLoading] = useState<boolean>(false);

  // Synchronize screen state if isRegistered status changes
  useEffect(() => {
    if (!isRegistered) {
      setScreen('REGISTRATION');
    }
  }, [isRegistered]);

  // Local device ledgers filtered for this phone
  const myLedger = transactions.filter(t => t.from === iid || t.to === iid);

  // Update initial messages based on screens
  useEffect(() => {
    if (lang === 'ID') {
      if (screen === 'DASHBOARD') {
        setAuraMessage('Akun aktif bimbingan menyala. Tekan tombol KIRIM atau TERIMA di bawah untuk mulai transaksi offline.');
        setAuraVoice('Akun aktif bimbingan menyala. Silakan tekan tombol kirim atau terima di bawah untuk memulai transaksi tanpa internet.');
        setAuraStepLabel('Silakan tekan tombol yang bersinar.');
      } else if (screen === 'TERIMA') {
        setAuraMessage('Tentukan nominal yang ingin Anda terima, kemudian tekan BUAT QR CODE untuk menunjukkannya ke pengirim.');
        setAuraVoice('Tentukan jumlah uang yang ingin Anda terima, kemudian tekan Buat kyu are code untuk menunjukkannya ke pengirim.');
        setAuraStepLabel(`${ownerName}: Ketik nominal & buat QR Code.`);
      } else if (screen === 'KIRIM_SCAN') {
        setAuraMessage('Lensa AI diaktifkan. Dekatkan kamera ke QR code di HP penerima untuk membaca informasi transaksi seketika.');
        setAuraVoice('Lensa AI diaktifkan. Dekatkan kamera Anda ke kyu are code di HP penerima untuk membaca informasi transaksi seketika.');
        setAuraStepLabel(`${ownerName}: Arahkan lensa ke QR Code penerima.`);
      } else if (screen === 'KIRIM_CONFIRM') {
        setAuraMessage(`Mengirim Rp ${stagedTx?.amount.toLocaleString('id-ID')} kepada ${stagedTx?.receiverName}. Tekan tombol KONFIRMASI untuk menguji kunci keamanan.`);
        setAuraVoice(`Mengirim ${stagedTx?.amount} rupiah kepada ${stagedTx?.receiverName}. Tekan tombol konfirmasi untuk menguji kunci keamanan sidik jari.`);
        setAuraStepLabel(`${ownerName}: Tekan Konfirmasi Kirim.`);
      } else if (screen === 'BIOMETRIC_AUTH') {
        setAuraMessage('Verifikasi keamanan biometrik sidik jari diperlukan untuk mengesahkan tanda tangan digital enkripsi IID Anda.');
        setAuraVoice('Verifikasi keamanan biometrik sidik jari diperlukan untuk mengesahkan tanda tangan digital enkripsi identitas Anda.');
        setAuraStepLabel(`${ownerName}: Sentuh sensor sidik jari di tengah layar.`);
      } else if (screen === 'SUCCESS') {
        setAuraMessage('Transaksi selesai. Terima kasih telah menggunakan Technology Money. Selamat menggunakan Rp 20 juta dari Teknologi Peradaban Kebaikan.');
        setAuraVoice('Transaksi selesai. Terima kasih telah menggunakan Teknoloji Mani. Selamat menggunakan dua puluh juta rupiah dari Teknologi Peradaban Kebaikan.');
        setAuraStepLabel('Sovereign Offline Transaction Berhasil!');
      } else if (screen === 'RIWAYAT') {
        setAuraMessage('Menampilkan catatan SQLite offline di dalam memori penyimpanan aman HP Anda.');
        setAuraVoice('Menampilkan catatan es kyu el tumpuk offline di dalam memori penyimpanan aman HP anda.');
        setAuraStepLabel('Buku Kas Offline Ledger');
      } else if (screen === 'REGISTRATION') {
        setAuraMessage('Silakan masukkan nama Anda untuk membuat akun IID dan menerima Dana Bantuan Kebaikan Rp 20 Juta.');
        setAuraVoice('Silakan masukkan nama lengkap Anda untuk membuat akun identitas IID dan menerima Dana Bantuan Kebaikan sebesar dua puluh juta rupiah gratis.');
        setAuraStepLabel('Registrasi Pengguna Baru');
      } else if (screen === 'REGISTRATION_SUCCESS') {
        setAuraMessage(`Selamat! Berhasil mendaftarkan IID. Saldo perdana Rp 20 Juta dari program bantuan kemanusiaan Peradaban Kebaikan telah aktif.`);
        setAuraVoice('Selamat! Berhasil mendaftarkan identitas IID. Saldo perdana sebesar dua puluh juta rupiah dari program bantuan kemanusiaan Peradaban Kebaikan telah aktif.');
        setAuraStepLabel('Pendaftaran Berhasil!');
      }
    } else {
      // English AURA guides
      if (screen === 'DASHBOARD') {
        setAuraMessage('Account active under assistant guidance. Press SEND or RECEIVE buttons below to begin offline transactions.');
        setAuraVoice('Account active under assistant guidance. Please press send or receive buttons below to begin offline transactions.');
        setAuraStepLabel('Please press any pulsing action buttons.');
      } else if (screen === 'TERIMA') {
        setAuraMessage('Enter the target amount you wish to receive, then click GENERATE QR CODE for the sender to scan.');
        setAuraVoice('Enter the amount of money you want to receive, then press generate cue are code to display it to the sender.');
        setAuraStepLabel(`${ownerName}: Type amount & build QR Code.`);
      } else if (screen === 'KIRIM_SCAN') {
        setAuraMessage('AI Lenses active. Align the camera with the receiver\'s QR code to read secure offline payment payloads instantly.');
        setAuraVoice('Ay eye lenses active. Direct your camera to the receptor cue are code to extract secure information instantly.');
        setAuraStepLabel(`${ownerName}: Point camera to receiver\'s QR Code.`);
      } else if (screen === 'KIRIM_CONFIRM') {
        setAuraMessage(`Sending Rp ${stagedTx?.amount.toLocaleString('en-US')} to ${stagedTx?.receiverName}. Click CONTINUE to biometric clearance.`);
        setAuraVoice(`Sending ${stagedTx?.amount} rupiah to ${stagedTx?.receiverName}. Press continue to verify your biometric fingerprint credentials.`);
        setAuraStepLabel(`${ownerName}: Click Confirm Send.`);
      } else if (screen === 'BIOMETRIC_AUTH') {
        setAuraMessage('Biometric confirmation is required to seal the digital ECDSA signature with your sovereign offline key chip.');
        setAuraVoice('Biometric confirmation is required to lock and seal your private cryptographical signature keys.');
        setAuraStepLabel(`${ownerName}: Touch the fingerprint sensor in the middle.`);
      } else if (screen === 'SUCCESS') {
        setAuraMessage('Transaction completed offline. Thank you for utilizing TM. Enjoy your Rp 20 Million citizen bootstrap funds.');
        setAuraVoice('Transaction completed offline. Thank you for utilizing Technology Money. Your twenty million rupiah aid is ready for trades.');
        setAuraStepLabel('Sovereign Offline Transaction Succeeded!');
      } else if (screen === 'RIWAYAT') {
        setAuraMessage('Displaying offline SQLite master logs located within your device\'s local storage partition.');
        setAuraVoice('Displaying offline ledger logs from your device local storage memory.');
        setAuraStepLabel('Sovereign Offline Ledger');
      } else if (screen === 'REGISTRATION') {
        setAuraMessage('Please enter your details to generate your secure Sovereign Identity (IID) & receive the Rp 20M gift voucher.');
        setAuraVoice('Please type your name to generate your sovereign identity cue number and receive twenty million rupiah starter funds.');
        setAuraStepLabel('Sovereign User Registration');
      } else if (screen === 'REGISTRATION_SUCCESS') {
        setAuraMessage(`Excellent! Your sovereign IID key has been verified. Initial seed grant of Rp 20M is active.`);
        setAuraVoice(`Excellent! Your sovereign identity is generated. Your starter ledger balance is active in your phone register.`);
        setAuraStepLabel('Registration Completed!');
      }
    }
  }, [screen, lang, stagedTx, ownerName]);

  // Synthetic tone generator to simulate hardware prompt
  const triggerAudioBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(950, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.125);
    } catch (e) {
      console.log('AudioContext blocked or unavailable:', e);
    }
  };

  // Step 4: BUAT QR CODE (Receive Screen)
  const handleGenerateQr = () => {
    const qrPayload = {
      receiver: iid,
      amount: inputAmount
    };
    const payloadString = JSON.stringify(qrPayload);
    setActiveQrValueString(payloadString);
    onSetMyActiveQr(qrPayload); // publish to system so peer can "scan" it
    triggerAudioBeep();
    
    if (lang === 'ID') {
      setAuraMessage(`QR Code diterbitkan untuk Rp ${inputAmount.toLocaleString('id-ID')}. Berikan kode ini agar bisa dipindai oleh ${otherPhoneName}.`);
      setAuraVoice(`Kyu are code berhasil diterbitkan sebesar ${inputAmount} rupiah. Berikan kode ini agar dipindai oleh pengirim.`);
    } else {
      setAuraMessage(`QR Code generated for Rp ${inputAmount.toLocaleString('en-US')}. Provide this code to be scanned by ${otherPhoneName}.`);
      setAuraVoice(`Cue are code successfully generated for ${inputAmount} rupiah. Show this code to the sender.`);
    }
  };

  // Step 5: SCAN PEER QR (Scan Screen)
  const handleScanPeer = () => {
    if (otherPhoneActiveQr) {
      triggerAudioBeep();
      setStagedTx({
        receiverIid: otherPhoneActiveQr.receiver,
        receiverName: otherPhoneName,
        amount: otherPhoneActiveQr.amount
      });
      setScreen('KIRIM_CONFIRM');
    } else {
      if (lang === 'ID') {
        setAuraMessage(`Lensa tidak menemukan QR code aktif di HP ${otherPhoneName}. Pastikan ${otherPhoneName} sudah menekan tombol BUAT QR CODE.`);
        setAuraVoice(`Lensa tidak menemukan kyu are code aktif di HP penerima. Pastikan penerima sudah menekan tombol buat kyu are code.`);
      } else {
        setAuraMessage(`Lens cannot locate any active QR code on ${otherPhoneName}'s display. Please ensure they clicked GENERATE QR CODE.`);
        setAuraVoice(`Lens cannot locate any active cue are code on the receiving phone. Ensure the receiver has generated the code.`);
      }
    }
  };

  const handleManualImportQr = () => {
    // Manual simulation in case user wants to test custom values
    triggerAudioBeep();
    setStagedTx({
      receiverIid: otherPhoneIid,
      receiverName: otherPhoneName,
      amount: 15000 // default mock amount
    });
    setScreen('KIRIM_CONFIRM');
  };

  // Step 6 & 7: SIDIK JARI BIOMETRIC SENSOR & TX RECORDING
  const handleScanFingerprint = async () => {
    setIsProcessingBiometric(true);
    triggerAudioBeep();
    
    setTimeout(async () => {
      setIsProcessingBiometric(false);
      setBiometricSuccess(true);
      triggerAudioBeep();
      
      if (!stagedTx) return;

      // Construct ledger transaction schema (Langkah 7)
      const txId = `TX000${transactions.length + 1}`;
      const timestampString = new Date().toISOString().replace('Z', '');
      
      const rawDataForHash = `${txId}_${iid}_${stagedTx.receiverIid}_${stagedTx.amount}_${timestampString}`;
      const txHash = await calculateSHA256(rawDataForHash);
      const txSignature = generateEcdsaSignature(txHash, iid);

      const newTx: Transaction = {
        tx: txId,
        from: iid,
        fromName: ownerName,
        to: stagedTx.receiverIid,
        toName: stagedTx.receiverName,
        amount: stagedTx.amount,
        timestamp: timestampString,
        hash: txHash,
        signature: txSignature,
        status: internetOnline ? 'SYNCED' : 'SUCCESS', // SUCCESS is local verified, SYNCED is synced with server
        deliveryMode: bluetoothP2pRange ? 'BLUETOOTH' : 'QR'
      };

      // Apply balance changes locally on sender side
      onUpdateBalance(balance - stagedTx.amount);
      onAddTransaction(newTx);
      setLastCompletedTx(newTx);

      // Trigger Langkah 8 - Bluetooth Relay
      if (bluetoothP2pRange) {
        onReceiveBluetoothRelay(newTx);
      }

      setScreen('SUCCESS');
      onSetMyActiveQr(null); // Clear QR
    }, 1200);
  };

  // Help support questions for elders (Bilingual)
  const handleAskAura = () => {
    if (!chatInput.trim()) return;
    
    const query = chatInput.toLowerCase();
    let reply = '';
    
    if (lang === 'ID') {
      if (query.includes('iid') || query.includes('identitas') || query.includes('identity')) {
        reply = 'IID (Sovereign Identity) adalah nomor KTP digital khusus Technology Money Anda. Contoh punya Anda adalah ' + iid + '. Dibuat secara acak aman tanpa membutuhkan server internet, menggunakan kriptografi langsung dalam HP Anda.';
      } else if (query.includes('offline') || query.includes('tanpa internet')) {
        reply = 'Sistem TM dirancang khusus untuk desa terpencil atau area bencana. Transaksi disimpan dalam pembukuan SQLite lokal HP Anda, dan dikirim ke pembukuan rekan via sinyal Bluetooth atau QR code. Begitu HP Anda mendapat akses internet kembali, catatan akan disinkronkan secara aman.';
      } else if (query.includes('bluetooth') || query.includes('relay')) {
        reply = 'Fitur Bluetooth Relay memancarkan data transaksi yang sudah Anda tandatangani dari HP Anda menuju HP rekan langsung lewat udara tanpa butuh kuota data internet atau BTS.';
      } else if (query.includes('hadiah') || query.includes('20 juta') || query.includes('saldo') || query.includes('rewards') || query.includes('grant')) {
        reply = 'Setiap akun perdana berhak menerima program dana bantuan Technology Money Rp 20.000.000 gratis dari Peradaban Kebaikan untuk mendukung roda ekonomi mikro pedesaan offline.';
      } else {
        reply = 'AURA siap membimbing Bapak Ahmad dan Ibu Siti. Kita bisa bertransaksi tanpa uang kertas secara aman. Ingin tahu tentang cara "Kirim", "Terima", "Aura AI", atau "Sistem Offline"?';
      }
    } else {
      if (query.includes('iid') || query.includes('identitas') || query.includes('identity')) {
        reply = 'IID (Sovereign Identity) is your Technology Money exclusive custom digital ID. Yours is ' + iid + '. Generated 100% locally on your device using keys in the security hardware, with no server required.';
      } else if (query.includes('offline') || query.includes('no internet') || query.includes('without internet')) {
        reply = 'The TM platform is designed for ultra-remote rural communities. Transacts reside in your phone\'s local SQLite, syncing wirelessly to peers via Bluetooth or QR code. Once web cellular signal is back, data uploads to secure cloud nodes automatically.';
      } else if (query.includes('bluetooth') || query.includes('relay')) {
        reply = 'The custom Bluetooth P2P Relay streams your signed transactions straight through the air to your peer\'s device without any mobile towers or internet connection.';
      } else if (query.includes('hadiah') || query.includes('20 million') || query.includes('20m') || query.includes('grant') || query.includes('balance') || query.includes('rewards')) {
        reply = 'Every newly registered citizen receives an autonomous Rp 20,000,000 seed grant from the Technology of Kindness initiative to spark dynamic offline micro-economies.';
      } else {
        reply = 'AURA AI is ready to assist you. We can securely transact cashless offline. Do you want to ask about "Send", "Receive", "Aura AI", or "Offline Systems"?';
      }
    }

    setChatReply(reply);
    setAuraMessage(reply);
    setAuraVoice(reply);
    setChatInput('');
  };

  // Generate highly formatted Transaction Receipt PDF
  const handleDownloadReceiptPdf = () => {
    if (!lastCompletedTx) return;
    
    // Create jsPDF instance (Receipt mode, 80mm wide receipt roll format)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 150]
    });
    
    const xCenter = 40;
    
    // Title & Logo
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(16, 185, 129); // emerald
    doc.text("TECHNOLOGY MONEY", xCenter, 15, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // slate-400
    doc.text("Sovereign Offline Ledger", xCenter, 20, { align: 'center' });
    doc.text("Technology for Good & Kindness", xCenter, 24, { align: 'center' });
    
    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(10, 28, 70, 28);
    
    // Receipt Details
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59); // slate-800
    
    let y = 35;
    const rowHeight = 6;
    
    // Tx Info rows
    const writeRow = (labelID: string, labelEN: string, value: string) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(lang === 'ID' ? labelID : labelEN, 10, y);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(value, doc.internal.pageSize.width - 10, y, { align: 'right' });
      y += rowHeight;
    };
    
    writeRow("KODE TX / TX ID:", "TX CODE / ID:", lastCompletedTx.tx);
    writeRow("TANGGAL / DATE:", "TIMESTAMP:", lastCompletedTx.timestamp + " UTC");
    
    doc.line(10, y + 1, 70, y + 1);
    y += 6;
    
    writeRow("PENGIRIM / SENDER:", "SENDER:", lastCompletedTx.fromName);
    writeRow("IID PENGIRIM:", "SENDER IID:", lastCompletedTx.from);
    writeRow("PENERIMA / RECIPIENT:", "RECIPIENT:", lastCompletedTx.toName);
    writeRow("IID PENERIMA:", "RECIPIENT IID:", lastCompletedTx.to);
    
    doc.line(10, y + 1, 70, y + 1);
    y += 6;
    
    // Amount Row
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(16, 185, 129);
    doc.text(lang === 'ID' ? "JUMLAH TOTAL:" : "TOTAL AMOUNT:", 10, y);
    doc.setFontSize(11);
    doc.text(`Rp ${lastCompletedTx.amount.toLocaleString('id-ID')}`, doc.internal.pageSize.width - 10, y, { align: 'right' });
    y += rowHeight + 3;
    
    writeRow("BIAYA ADMIN / FEE:", "ADMIN FEE:", "Rp 0 (GRATIS/FREE)");
    writeRow("MODUL TRANSFER:", "DELIVERY MODE:", lastCompletedTx.deliveryMode);
    writeRow("STATUS TX / STATUS:", "TX STATUS:", lastCompletedTx.status);
    
    doc.line(10, y + 1, 70, y + 1);
    y += 8;
    
    // Signature raw hash
    doc.setFont("courier", "bold");
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text("ECDSA METADATA RECORD:", 10, y);
    y += 4;
    
    doc.setFont("courier", "normal");
    const hashCut = lastCompletedTx.hash ? lastCompletedTx.hash.substring(0, 30) + "..." : "N/A";
    const sigCut = lastCompletedTx.signature ? lastCompletedTx.signature.substring(0, 30) + "..." : "N/A";
    doc.text(`HASH: ${hashCut}`, 10, y);
    y += 3.5;
    doc.text(`SIG : ${sigCut}`, 10, y);
    y += 6;
    
    // Footer message
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(
      lang === 'ID' ? "Teknologi Untuk Kebaikan Bersama" : "Technology For Good and Well-Being",
      xCenter,
      y,
      { align: 'center' }
    );
    doc.text(
      lang === 'ID' ? "Sovereign Offline - Peradaban Kebaikan" : "Sovereign Offline - KINDNESS Civilization",
      xCenter,
      y + 3.5,
      { align: 'center' }
    );
    
    // Save PDF
    doc.save(`TM_Receipt_${lastCompletedTx.tx}.pdf`);
  };

  return (
    <div className="relative mx-auto max-w-[340px] w-full">
      {/* PHONE FRAME LAYOUT */}
      <div className="relative border-x-[10px] border-b-[10px] border-t-[12px] border-slate-950 bg-slate-900 rounded-[38px] shadow-2xl p-0.5 overflow-hidden font-sans aspect-[9/19]">
        
        {/* Android top speaker & camera punch-hole spacer */}
        <div className="absolute top-[3px] left-1/2 -translate-x-1/2 h-3.5 w-24 bg-slate-950 rounded-full z-40 flex items-center justify-center">
          <div className="h-1 w-8 bg-slate-800 rounded-full mr-2"></div>
          <div className="h-1.5 w-1.5 bg-slate-900 rounded-full"></div>
        </div>

        {/* STATUS SCREEN BAR */}
        <div className="bg-slate-950 text-[10px] text-slate-400 px-4 pt-1 pb-1.5 flex items-center justify-between z-30 font-mono select-none">
          <span>09:00</span>
          <div className="flex items-center gap-2">
            <span className="text-[9px] px-1 bg-slate-900 rounded text-amber-500 font-bold border border-slate-800">
              IID ACTIVE
            </span>
            {bluetoothP2pRange && (
              <Bluetooth className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            )}
            {internetOnline ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-rose-500" />
            )}
            <span className="text-[9px]">98%</span>
          </div>
        </div>

        {/* MOBILE CONTAINER BODY */}
        <div className="flex flex-col h-[calc(100%-24px)] bg-slate-950 text-slate-100 p-3 select-none justify-between">
          
          {/* HEADER PROFILE INFO */}
          <div className="bg-slate-900/60 rounded-xl p-2.5 border border-slate-850 flex items-center justify-between">
            {isRegistered ? (
              <div className="flex items-center gap-2.5">
                <TMLogo size="sm" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-white tracking-tight leading-none">{ownerName}</h4>
                    <button 
                      onClick={() => {
                        triggerAudioBeep();
                        onDeregister();
                      }}
                      className="text-[8px] bg-slate-950 px-1 py-0.5 rounded border border-slate-800 text-rose-450 hover:bg-rose-950 hover:text-rose-300 font-bold leading-none"
                      title={lang === 'ID' ? "Ganti Akun / Daftar Baru" : "Change Account / New Register"}
                    >
                      {lang === 'ID' ? 'Daftar Baru' : 'New Register'}
                    </button>
                  </div>
                  <p className="text-[9px] font-mono text-slate-400 leading-none mt-1">{iid}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-500 animate-pulse" />
                <div>
                  <h4 className="text-xs font-bold text-slate-300 leading-tight">
                    {lang === 'ID' ? 'Belum Registrasi IID' : 'IID Unregistered'}
                  </h4>
                  <p className="text-[8px] font-mono text-slate-500 leading-none">
                    {lang === 'ID' ? 'Dompet Offline Mati' : 'Offline Wallet Off'}
                  </p>
                </div>
              </div>
            )}
            
            <button 
              onClick={() => setScreen('AURA_CHAT')}
              className="px-2 py-1 bg-slate-950 hover:bg-slate-800 rounded-lg text-[9px] font-medium border border-slate-800 text-indigo-400 flex items-center gap-1"
            >
              <Sparkles className="w-2.5 h-2.5" />
              {lang === 'ID' ? 'Tanya AURA' : 'Ask AURA'}
            </button>
          </div>

          {/* ACTIVE CONTENT CARD SWITCH */}
          <div className="flex-1 my-3 flex flex-col justify-between overflow-y-auto min-h-0">
            {screen === 'REGISTRATION' && (
              <div className="flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      {lang === 'ID' ? 'Registrasi IID Rakyat' : 'Sovereign IID Registration'}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-normal">
                    {lang === 'ID' 
                      ? 'Buat identitas berdaulat lokal (IID) aman Anda secara instan tanpa server untuk menerima Rp 20 Juta program Swadaya Kebaikan.'
                      : 'Generate your secure local sovereign identity (IID) instantly offline to receive a Rp 20 Million Swadaya Kebaikan grant.'}
                  </p>

                  <div className="space-y-2">
                    <div>
                      <label className="text-[9px] text-slate-400 font-bold block mb-1">
                        {lang === 'ID' ? 'Nama Lengkap / Alias' : 'Full Name / Alias'}
                      </label>
                      <input
                        type="text"
                        placeholder={lang === 'ID' ? 'Contoh: Pak Kadir, Kak Ros' : 'e.g. John Doe, Alice'}
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold focus:border-amber-500 outline-none text-white placeholder-slate-650"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-400 font-bold block mb-1">
                        {lang === 'ID' ? 'Kode Suku / Wilayah Binaan' : 'Tribe Code / Managed Territory'}
                      </label>
                      <select
                        value={regRegion}
                        onChange={(e) => setRegRegion(e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:border-amber-500 outline-none text-white font-mono"
                      >
                        <option value="062">{lang === 'ID' ? '062 (Suku Jawa / Nusantara)' : '062 (Javanese / Archipelago)'}</option>
                        <option value="021">{lang === 'ID' ? '021 (Wilayah Jabodetabek)' : '021 (Greater Jakarta)'}</option>
                        <option value="031">{lang === 'ID' ? '031 (Wilayah Timur)' : '031 (Eastern Region)'}</option>
                        <option value="099">{lang === 'ID' ? '099 (Wilayah Perbatasan)' : '099 (Border Territories)'}</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-400 font-bold block mb-1">
                        {lang === 'ID' ? 'Nomor Telepon / Seri HP' : 'Phone Number / HP Serial'}
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: 081234567890"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono focus:border-amber-500 outline-none text-white placeholder-slate-650"
                      />
                    </div>

                    <div className="flex items-center gap-2 p-2 bg-slate-900/40 border border-slate-850 rounded-xl">
                      <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="text-[9px] text-slate-400 leading-normal">
                        {lang === 'ID' ? (
                          <>Sistem membuat pasangan kunci <strong>ECDSA SECP256K1</strong> di chip keamanan offline HP Anda.</>
                        ) : (
                          <>The system generates a secure <strong>ECDSA SECP256K1</strong> keypair inside your phone's hardware chip.</>
                        )}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (!regName.trim()) {
                        alert(lang === 'ID' ? "Mohon masukkan nama Anda!" : "Please enter your name!");
                        return;
                      }
                      
                      setIsRegLoading(true);
                      triggerAudioBeep();
                      
                      setTimeout(() => {
                        setIsRegLoading(false);
                        const initials = regName.slice(0, 3).toUpperCase().padEnd(3, 'X');
                        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
                        const generatedIid = `IID-001-${regRegion}-${initials}${randomSuffix}`;
                        
                        onRegister(regName, generatedIid);
                        setScreen('REGISTRATION_SUCCESS');
                        triggerAudioBeep();
                      }, 1200);
                    }}
                    disabled={isRegLoading}
                    className="w-full py-2.5 bg-amber-600 border border-amber-500 hover:bg-amber-500 text-slate-950 font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg animate-glow-amber"
                  >
                    {isRegLoading ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                        {lang === 'ID' ? 'MEMBUAT KUNCI IID AMAN...' : 'GENERATING SECURE IID...'}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        {lang === 'ID' ? 'GABUNG SEKARANG & TERIMA RP 20JT' : 'JOIN NOW & CLAIM RP 20M'}
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-2 text-[9px] text-slate-500 text-center font-sans">
                  {lang === 'ID' 
                    ? 'Dengan registrasi, Anda tergabung dalam Jaringan Swadaya Keuangan Mandiri Rakyat.'
                    : 'By registering, you participate in the Sovereign Financial Self-Reliance Network.'}
                </div>
              </div>
            )}

            {screen === 'REGISTRATION_SUCCESS' && (
              <div className="flex-1 flex flex-col justify-between">
                <div className="space-y-4 text-center py-2">
                  <div className="mx-auto h-14 w-14 rounded-full bg-emerald-950 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-bounce">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-white tracking-wide uppercase">
                      {lang === 'ID' ? 'PENDAFTARAN BERHASIL!' : 'REGISTRATION SUCCEEDED!'}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {lang === 'ID' ? 'Identitas Kedaulatan Anda Terdaftar' : 'Your Sovereign Identity Is Sealed'}
                    </p>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-left font-mono text-[10px] space-y-1.5">
                    <div>{lang === 'ID' ? 'NAMA KASIR:' : 'LEDGER OWNER:'} <span className="text-white font-bold">{ownerName}</span></div>
                    <div>{lang === 'ID' ? 'NOMOR IID:' : 'IID NUMBER:'} <span className="text-indigo-400 font-bold">{iid}</span></div>
                    <div>{lang === 'ID' ? 'SALDO REWARDS:' : 'REWARDS BALANCE:'} <span className="text-emerald-400 font-bold">Rp {balance.toLocaleString('id-ID')}</span></div>
                    <div className="text-[8px] text-slate-500 truncate pt-1">SEC_KEY: ECDSA SECP256K1 SAVED IN TEE</div>
                  </div>

                  <div className="bg-emerald-950/20 border border-emerald-900/60 p-2 text-emerald-400 rounded-xl text-[9px] text-left leading-relaxed">
                    {lang === 'ID' 
                      ? 'Dana Bantuan Kemanusiaan sebesar Rp 20 Juta telah diisikan ke brankas HP Anda. Anda sudah bisa bertransaksi instan tanpa internet sekarang!'
                      : 'Humanitarian assistance seed funding of Rp 20 Million has been unlocked inside your device. Start cashless transacting now!'}
                  </div>

                  <button
                    onClick={() => {
                      triggerAudioBeep();
                      setScreen('DASHBOARD');
                    }}
                    className="w-full py-2.5 bg-emerald-600 border border-emerald-500 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs shadow-md"
                  >
                    {lang === 'ID' ? 'MULAI TRANSAKSI KAS' : 'START TRANSACTIONS'}
                  </button>
                </div>

                <div className="text-[9px] text-slate-500 text-center">
                  {lang === 'ID' ? 'Nikmati kemandirian finansial seutuhnya bersama TM Offline.' : 'Enjoy full offline sovereign financial freedom with TM.'}
                </div>
              </div>
            )}

            {screen === 'DASHBOARD' && (
              <div className="flex-1 flex flex-col justify-between">
                
                {/* PWA INSTALL ACCELERATOR BUTTON */}
                {showInstallBtn && onInstallPWA && (
                  <button 
                    onClick={() => {
                      triggerAudioBeep();
                      onInstallPWA();
                    }}
                    className="mb-2 py-2 px-2.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-slate-950 font-black rounded-xl text-[10px] w-full text-center flex items-center justify-center gap-1.5 shadow-lg animate-pulse"
                    id="pinf-install-trigger-inside-phone"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    {lang === 'ID' ? '📲 PASANG APLIKASI (PWA 1-KLIK)' : '📲 INSTALL WALLET (1-CLICK PWA)'}
                  </button>
                )}

                {/* WALLET INTEGRITY COMPONENT STATS */}
                <div className="bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-950 p-4 rounded-xl border border-indigo-900/30 shadow-md text-center">
                  <div className="text-[10px] text-slate-400 font-medium uppercase tracking-widest flex items-center justify-center gap-1 mb-1">
                    <Coins className="w-3 h-3 text-amber-450" />
                    {lang === 'ID' ? 'Saldo Dompet Kebaikan' : 'Sovereign Wallet Balance'}
                  </div>
                  <h1 className="text-xl font-extrabold tracking-tight text-white mb-1">
                    Rp {balance.toLocaleString('id-ID')}
                  </h1>
                  
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-950 rounded-full border border-slate-850 text-[9px] text-slate-400 mt-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Sovereign Offline Ledger
                  </div>
                </div>

                {/* AURA INSTRUCTION EMBED */}
                <div className="my-2">
                  <AuraAiTutor
                    message={auraMessage}
                    voiceText={auraVoice}
                    highlightedStep={auraStepLabel}
                    isMuted={isMuted}
                    onToggleMute={onToggleMute}
                    accentColor={accentColor}
                    lang={lang}
                  />
                </div>

                {/* HEARTBEAT GLOW ACTION BUTTONS */}
                <div className="space-y-2 mt-auto">
                  <button
                    onClick={() => {
                      triggerAudioBeep();
                      setScreen('KIRIM_SCAN');
                    }}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all transition-duration-300 border bg-amber-600 border-amber-500 hover:bg-amber-500 text-slate-950 ${
                      accentColor === 'amber' ? 'animate-glow-amber' : ''
                    }`}
                    id={`${ownerId}-kirim-button`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    {lang === 'ID' ? 'KIRIM DATA SALDO' : 'SEND WALLET DATA'}
                  </button>

                  <button
                    onClick={() => {
                      triggerAudioBeep();
                      setScreen('TERIMA');
                    }}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all transition-duration-300 border bg-emerald-600 border-emerald-500 hover:bg-emerald-500 text-slate-950 ${
                      accentColor === 'emerald' ? 'animate-glow-emerald' : ''
                    }`}
                    id={`${ownerId}-terima-button`}
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    {lang === 'ID' ? 'TERIMA SALDO' : 'RECEIVE WALLET BALANCE'}
                  </button>

                  <button
                    onClick={() => {
                      triggerAudioBeep();
                      setScreen('RIWAYAT');
                    }}
                    className="w-full py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl font-bold text-[11px] text-slate-350 flex items-center justify-center gap-1.5"
                    id={`${ownerId}-riwayat-button`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {lang === 'ID' ? 'BUKU RIWAYAT KAS (SQLite)' : 'TRANSACTION HISTORY (SQLite)'}
                  </button>
                </div>

              </div>
            )}

            {screen === 'TERIMA' && (
              <div className="flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      {lang === 'ID' ? 'Terima Saldo' : 'Receive Balance'}
                    </span>
                    <button onClick={() => setScreen('DASHBOARD')} className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  {/* FORM INPUT NOMINAL */}
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">
                      {lang === 'ID' ? 'Pilih / Masukkan Nominal Transfer' : 'Choose / Enter Transaction Amount'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-450 font-bold">Rp</span>
                      <input
                        type="number"
                        value={inputAmount}
                        onChange={(e) => setInputAmount(Number(e.target.value))}
                        className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold font-mono focus:border-emerald-500 outline-none text-white"
                      />
                    </div>
                  </div>

                  {/* PRESET CHIPS */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {[10000, 50000, 100000, 2000000].map(amt => (
                      <button
                        key={amt}
                        onClick={() => {
                          triggerAudioBeep();
                          setInputAmount(amt);
                        }}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all ${
                          inputAmount === amt 
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-750' 
                            : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-850'
                        }`}
                      >
                        Rp {amt.toLocaleString('id-ID')}
                      </button>
                    ))}
                  </div>

                  {/* ACTION BUTTTON */}
                  <button
                    onClick={handleGenerateQr}
                    className="w-full py-2 bg-emerald-600 border border-emerald-500 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
                    id="submit-generate-qr-button"
                  >
                    <QrCode className="w-4 h-4" />
                    {lang === 'ID' ? 'BUAT QR CODE PENERIMA' : 'CREATE RECEIVER QR CODE'}
                  </button>

                  {/* QR CODE VIEWPORT */}
                  {activeQrValueString && (
                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-center flex flex-col justify-center shadow-lg">
                      <QrCodeCanvas value={activeQrValueString} />
                      <div className="mt-1.5 text-[8px] text-slate-650 font-mono break-all line-clamp-2 bg-slate-50 p-1 rounded border border-slate-100">
                        {activeQrValueString}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-2 text-[10px] text-center text-slate-550 bg-slate-900/40 p-2 border border-slate-850 rounded-xl font-sans leading-normal">
                  {activeQrValueString 
                    ? (lang === 'ID' ? "Beritahukan pengirim untuk memindai kode di atas." : "Ask the sender to scan this code on your display.") 
                    : (lang === 'ID' ? "Pastikan jumlah sudah benar sebelum menerbitkan QR code." : "Ensure the amount is correct before generating QR.")}
                </div>
              </div>
            )}

            {screen === 'KIRIM_SCAN' && (
              <div className="flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      {lang === 'ID' ? 'Pindai QR Penerima' : 'Scan Recipient QR'}
                    </span>
                    <button onClick={() => setScreen('DASHBOARD')} className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  {/* CAMERA SIMULATION PREVIEW VIEWPORT */}
                  <div className="relative border border-slate-800 bg-slate-900 rounded-xl aspect-square overflow-hidden shadow-inner flex flex-col items-center justify-center">
                    
                    {/* Viewfinder corner brackets */}
                    <div className="absolute top-4 left-4 h-5 w-5 border-t-2 border-l-2 border-amber-500"></div>
                    <div className="absolute top-4 right-4 h-5 w-5 border-t-2 border-r-2 border-amber-500"></div>
                    <div className="absolute bottom-4 left-4 h-5 w-5 border-b-2 border-l-2 border-amber-500"></div>
                    <div className="absolute bottom-4 right-4 h-5 w-5 border-b-2 border-r-2 border-amber-500"></div>

                    {/* Bi-directional scan beam */}
                    <div className="absolute left-2 right-2 h-0.5 bg-amber-500/80 shadow-[0_0_12px_#f59e0b] top-1/2 -translate-y-1/2 animate-bounce"></div>

                    {otherPhoneActiveQr ? (
                      <div className="text-center p-4">
                        <QrCode className="w-12 h-12 text-amber-500 mx-auto mb-2 animate-pulse" />
                        <span className="text-[10px] text-amber-400 font-bold bg-amber-955/20 px-2 py-1 rounded border border-amber-850">
                          {lang === 'ID' ? `MENDETEKSI QR CODE ${otherPhoneName.toUpperCase()}` : `DETECTING ${otherPhoneName.toUpperCase()}'S QR`}
                        </span>
                        
                        <button
                          onClick={handleScanPeer}
                          className="mt-4 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold rounded-lg shadow-md flex items-center gap-1.5 mx-auto border border-emerald-500"
                          id="laser-pindai-sim-button"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {lang === 'ID' ? 'KLIK UNTUK PINDAI' : 'TAP TO SCAN QR'}
                        </button>
                      </div>
                    ) : (
                      <div className="text-center p-4">
                        <AlertTriangle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                        <p className="text-[10px] text-slate-400 leading-normal max-w-[180px] mx-auto">
                          {lang === 'ID' ? 'Mencari QR Penerima aktif di seberang...' : 'Searching for peer QR display...'}
                        </p>
                        <p className="text-[9px] text-amber-500/80 italic mt-1 leading-normal max-w-[180px] mx-auto">
                          {lang === 'ID' 
                            ? `(Silakan klik "BUAT QR CODE" di HP ${otherPhoneName} terlebih dahulu agar kodenya terdeteksi)` 
                            : `(Please tap "CREATE RECEIVER QR CODE" on ${otherPhoneName}'s phone to present it)`}
                        </p>

                        <button
                          onClick={handleManualImportQr}
                          className="mt-4 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded-lg border border-slate-700 block w-full"
                          id="manual-qr-bypass-btn"
                        >
                          {lang === 'ID' ? 'Simulasikan Pindai Offline Rp 15.000' : 'Simulate Offline Scan Rp 15,000'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-2 text-[10px] text-center text-slate-500 bg-slate-900/40 p-2 border border-slate-850 rounded-xl font-sans leading-normal">
                  {lang === 'ID'
                    ? 'Sistem pemindaian Lensa AI dioperasikan otonom langsung di HP tanpa internet.'
                    : 'The camera lens computer vision scanning is hosted fully offline on-device.'}
                </div>
              </div>
            )}

            {screen === 'KIRIM_CONFIRM' && stagedTx && (
              <div className="flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-350">
                      {lang === 'ID' ? 'Konfirmasi Transfer' : 'Confirm Transaction'}
                    </span>
                    <button onClick={() => setScreen('DASHBOARD')} className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between border-b border-slate-950 pb-1">
                      <span className="text-slate-400">{lang === 'ID' ? 'Penerima:' : 'Recipient:'}</span>
                      <span className="text-white font-bold">{stagedTx.receiverName}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-950 pb-1">
                      <span className="text-slate-400">{lang === 'ID' ? 'IID Penerima:' : 'Recipient IID:'}</span>
                      <span className="text-slate-300 font-mono">{stagedTx.receiverIid}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-950 pb-1">
                      <span className="text-slate-400">{lang === 'ID' ? 'Jumlah:' : 'Amount:'}</span>
                      <span className="text-white font-bold text-sm">Rp {stagedTx.amount.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">{lang === 'ID' ? 'Biaya Admin:' : 'Admin Fee:'}</span>
                      <span className="text-emerald-400 font-bold">Rp 0 (GRATIS/FREE)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2.5 bg-amber-955/10 border border-amber-900/40 rounded-xl text-[10px] text-amber-500 leading-normal">
                    <Shield className="w-4 h-4 shrink-0" />
                    <span>
                      {lang === 'ID'
                        ? 'Enkripsi ECDSA akan di-generate menggunakan kunci privasi IID Anda saat autentikasi sidik jari.'
                        : 'Secure ECDSA cryptographic proof will be calculated using your private IID key upon biometric trigger.'}
                    </span>
                  </div>

                  {/* BIG PULSING CONFIRM BUTTON */}
                  <button
                    onClick={() => {
                      triggerAudioBeep();
                      setScreen('BIOMETRIC_AUTH');
                    }}
                    className="w-full py-3 bg-amber-600 border border-amber-500 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 animate-glow-amber"
                    id="submit-confirm-tx-button"
                  >
                    <Lock className="w-4 h-4" />
                    {lang === 'ID' ? 'LANJUTKAN KE BIOMETRIC' : 'PROCEED TO BIOMETRIC'}
                  </button>
                </div>

                <div className="mt-2 text-[10px] text-center text-slate-550 bg-slate-900/40 p-2 border border-slate-850 rounded-xl font-sans">
                  {lang === 'ID' ? 'Melindungi integritas transaksi offline.' : 'Ensuring the robust cryptographic integrity of offline values.'}
                </div>
              </div>
            )}

            {screen === 'BIOMETRIC_AUTH' && stagedTx && (
              <div className="flex-1 flex flex-col justify-between">
                <div className="space-y-4 text-center">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2 text-left">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-330">
                      {lang === 'ID' ? 'Biometrik Keamanan' : 'Biometric Security'}
                    </span>
                    <button onClick={() => setScreen('DASHBOARD')} className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-405 max-w-[240px] mx-auto leading-normal">
                    {lang === 'ID' 
                      ? 'Verifikasi sidik jari terpadu Android Biometric API untuk mengamankan data offline.'
                      : 'Secure fingerprint verification leveraging hardware TEE security boundaries.'}
                  </p>

                  {/* PULSING FINGERPRINT AREA */}
                  <div className="py-8">
                    <button
                      onClick={handleScanFingerprint}
                      disabled={isProcessingBiometric}
                      className={`relative mx-auto h-24 w-24 rounded-full flex items-center justify-center transition-all ${
                        isProcessingBiometric 
                          ? 'bg-amber-900/40 border-2 border-amber-500 animate-pulse' 
                          : 'bg-slate-900 hover:bg-slate-850 border-2 border-slate-700 hover:border-slate-500'
                      }`}
                      id="scan-fingerprint-biometric-button"
                    >
                      {isProcessingBiometric && (
                        <div className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin"></div>
                      )}
                      <Fingerprint className={`w-12 h-12 ${isProcessingBiometric ? 'text-amber-505 animate-pulse' : 'text-slate-300'}`} />
                    </button>
                    <span className="block text-[10px] text-slate-500 font-mono mt-3">
                      {isProcessingBiometric 
                        ? (lang === 'ID' ? "Memproses Kunci Enkripsi..." : "Sealing Ledger with Cipher Key...") 
                        : (lang === 'ID' ? "SENTUH SENSOR UNTUK OTORISASI" : "TOUCH SECURITY SENSOR TO SIGN")}
                    </span>
                  </div>

                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-850 text-[10px] text-slate-300">
                    {lang === 'ID' ? 'Otorisasi Kunci:' : 'Key Cryptographic Seal:'} <span className="font-mono text-indigo-400">{iid.substring(12)}</span>
                  </div>
                </div>

                <div className="mt-2 text-[10px] text-center text-slate-500 bg-slate-900/40 p-2 border border-slate-850 rounded-xl font-sans">
                  {lang === 'ID' 
                    ? 'Biometrik diselesaikan offline secara otonom dalam chip hardware HP.'
                    : 'Biometric authorization is stored strictly within secure processor enclaves.'}
                </div>
              </div>
            )}

            {screen === 'SUCCESS' && lastCompletedTx && (
              <div className="flex-1 flex flex-col justify-between">
                <div className="space-y-3 px-0.5 text-center">
                  <div className="mx-auto h-11 w-11 rounded-full bg-emerald-950/80 border border-emerald-400 flex items-center justify-center text-emerald-405 shadow-glow-emerald">
                    <CheckCircle2 className="w-5 h-5 animate-pulse" />
                  </div>

                  <h2 className="text-xs font-black text-white uppercase tracking-wider">
                    {lang === 'ID' ? 'Transaksi Selesai Offline' : 'Transaction Saved Offline'}
                  </h2>
                  
                  <div className="bg-gradient-to-r from-emerald-950/25 via-slate-900/50 to-slate-950 p-2.5 rounded-xl border border-emerald-900/40 text-xs text-slate-200 text-left font-mono space-y-1">
                    <div className="text-[9px] text-emerald-400 uppercase font-black tracking-widest text-center border-b border-emerald-900/40 pb-1 mb-1">
                      {lang === 'ID' ? 'KAS BANTUAN PERADABAN' : 'KINDNESS CASH RECORD'}
                    </div>
                    <div>STATUS: <span className="text-emerald-400 font-bold">{lang === 'ID' ? 'SUKSES (Offline)' : 'SUCCESS (Offline)'}</span></div>
                    <div>KODE TX: <span className="text-indigo-400">{lastCompletedTx.tx}</span></div>
                    <div>{lang === 'ID' ? 'PENERIMA:' : 'RECIPIENT:'} <span className="text-white font-bold">{lastCompletedTx.toName}</span></div>
                    <div>{lang === 'ID' ? 'NOMINAL:' : 'AMOUNT:'} <span className="text-white font-bold">Rp {lastCompletedTx.amount.toLocaleString('id-ID')}</span></div>
                    <div className="text-[7.5px] text-slate-500 truncate mt-0.5">HASH: {lastCompletedTx.hash}</div>
                  </div>

                  {/* Bluetooth automatic notification */}
                  <div className="flex items-start gap-1.5 p-2 bg-blue-955/10 border border-blue-900/40 rounded-xl text-[9px] text-blue-400 text-left leading-snug">
                    <Bluetooth className="w-3.5 h-3.5 shrink-0 animate-pulse text-blue-400" />
                    <span>
                      {bluetoothP2pRange 
                        ? (lang === 'ID' ? `Data ditransmisikan via Bluetooth ke HP ${otherPhoneName} langsung secepat kilat.` : `Payload streamed instantly via Bluetooth P2P radio directly to ${otherPhoneName}'s phone.`)
                        : (lang === 'ID' ? `Mencatatkan Bluetooth Relay, dekatkan HP ${otherPhoneName} agar saldonya langsung diperbarui!` : `Broadcasting local sync beacons. Bring ${otherPhoneName}'s phone closer to trigger real-time balance propagation!`)}
                    </span>
                  </div>

                  {/* PDF RECEIPT DOWNLOAD ACTION */}
                  <button
                    onClick={() => {
                      triggerAudioBeep();
                      handleDownloadReceiptPdf();
                    }}
                    className="w-full py-2 bg-gradient-to-r from-indigo-600 to-indigo-505 border border-indigo-500 hover:from-indigo-500 text-white font-bold rounded-xl text-[10px] flex items-center justify-center gap-1.5 shadow-md"
                    id="download-pdf-receipt-button"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {lang === 'ID' ? '📥 UNDUH TANDA BUKTI PDF' : '📥 DOWNLOAD PDF RECEIPT'}
                  </button>

                  <button
                    onClick={() => {
                      triggerAudioBeep();
                      setScreen('DASHBOARD');
                    }}
                    className="w-full py-2 bg-emerald-600 border border-emerald-500 hover:bg-emerald-505 text-slate-950 font-bold rounded-xl text-[10px]"
                    id="finish-success-screen-button"
                  >
                    {lang === 'ID' ? 'KEMBALI KE BERANDA (DASHBOARD)' : 'BACK TO DASHBOARD'}
                  </button>
                </div>

                <div className="mt-1 text-[9px] text-center text-slate-550 leading-none">
                  {lang === 'ID' ? 'Akurasi data dilindungi kuat algoritma ECDSA.' : 'Data integrity protected via certified ECDSA signatures.'}
                </div>
              </div>
            )}
            {screen === 'RIWAYAT' && (
              <div className="flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-350">
                      {lang === 'ID' ? 'SQLite Offline Ledger' : 'Local SQLite Ledger'}
                    </span>
                    <button onClick={() => setScreen('DASHBOARD')} className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-0.5">
                    {myLedger.length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-600 font-mono">
                        {lang === 'ID' ? 'Belum ada riwayat transaksi kas offline tersimpan.' : 'No offline cache records found in local phone storage.'}
                      </div>
                    ) : (
                      myLedger.map((tx) => {
                        const isSender = tx.from === iid;
                        return (
                          <div key={tx.tx} className="bg-slate-900/90 border border-slate-850 p-2 rounded-xl text-[10px]">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-mono text-slate-450 font-bold">{tx.tx}</span>
                              <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-mono font-bold uppercase ${
                                tx.status === 'SYNCED' 
                                  ? 'bg-emerald-950 border border-emerald-800 text-emerald-400' 
                                  : 'bg-amber-955/20 border border-amber-805 text-amber-500 animate-pulse'
                              }`}>
                                {tx.status === 'SYNCED' 
                                  ? (lang === 'ID' ? 'SINKRON' : 'SYNCED') 
                                  : (lang === 'ID' ? 'LOKAL' : 'LOCAL')}
                              </span>
                            </div>
                            
                            <div className="flex justify-between text-slate-200 mb-1">
                              <div className="flex items-center gap-1">
                                {isSender ? (
                                  <ArrowUpRight className="w-3 h-3 text-rose-455" />
                                ) : (
                                  <ArrowDownLeft className="w-3 h-3 text-emerald-455" />
                                )}
                                <span>
                                  {isSender 
                                    ? (lang === 'ID' ? `Ke ${tx.toName}` : `To ${tx.toName}`) 
                                    : (lang === 'ID' ? `Dari ${tx.fromName}` : `From ${tx.fromName}`)}
                                </span>
                              </div>
                              <span className={`font-bold ${isSender ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {isSender ? '-' : '+'} Rp {tx.amount.toLocaleString('id-ID')}
                              </span>
                            </div>

                            <p className="text-[7.5px] font-mono text-slate-500 truncate">
                              Signature verified via ECDSA
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="mt-2 text-[10px] text-center text-slate-550 bg-slate-900/40 p-2 border border-slate-850 rounded-xl font-sans leading-normal">
                  {lang === 'ID' ? 'Keutuhan data dicek otonom oleh node lokal.' : 'Sovereign Edge Computing offline ledger integrity active.'}
                </div>
              </div>
            )}

            {screen === 'AURA_CHAT' && (
              <div className="flex-1 flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                      {lang === 'ID' ? 'Diskusi Bersama AURA' : 'Chat with AURA AI'}
                    </span>
                    <button onClick={() => setScreen('DASHBOARD')} className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-405 leading-normal">
                    {lang === 'ID' 
                      ? 'Ajukan pertanyaan seputar IID, transaksi offline, kyu are code, atau rewards awal Rp 20 juta.'
                      : 'Ask about secure digital IIDs, off-grid transaction signatures, QR mechanics, or the 20 million cash grant.'}
                  </p>

                  <div className="bg-slate-900 text-xs rounded-xl p-2.5 border border-slate-800 font-sans max-h-36 overflow-y-auto min-h-12 leading-relaxed">
                    {chatReply ? (
                      <span className="text-slate-100 italic">" {chatReply} "</span>
                    ) : (
                      <span className="text-slate-505">
                        {lang === 'ID' 
                          ? '"Tanyakan bagaimana cara kerja Bluetooth offline atau dana bantuan 20 juta saya..."' 
                          : '"Ask how off-grid Bluetooth relays operate, or enquire about your seed wallet grant..."'}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-1">
                    <input
                      type="text"
                      placeholder={lang === 'ID' ? 'Tanya info offline/IID/saldo...' : 'Ask about offline mode / IID / grants...'}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAskAura()}
                      className="flex-1 text-xs px-2.5 py-1.5 bg-slate-955 border border-slate-800 rounded-xl outline-none focus:border-indigo-500 text-white"
                    />
                    <button 
                      onClick={handleAskAura}
                      className="px-2.5 py-1.5 bg-indigo-650 hover:bg-indigo-600 rounded-xl text-xs font-bold font-sans border border-indigo-500"
                    >
                      {lang === 'ID' ? 'Kirim' : 'Send'}
                    </button>
                  </div>

                  {/* QUICK ACCESS QUESTIONS */}
                  <div className="flex flex-wrap gap-1">
                    {(lang === 'ID' 
                      ? ["Apa itu IID?", "Mengapa Rp 20 Juta?", "Bagaimana cara Offline?"] 
                      : ["What is IID?", "Why Rp 20 Million?", "How does Offline work?"]
                    ).map(q => (
                      <button
                        key={q}
                        onClick={() => {
                          setChatInput(q);
                          triggerAudioBeep();
                        }}
                        className="text-[9px] px-2 py-1 bg-slate-900/50 border border-slate-850 rounded hover:bg-slate-850 font-bold"
                      >
                        {q}
                      </button>
                    ))}
                  </div>

                </div>

                <div className="text-[9px] text-center text-slate-505 mt-2 bg-slate-900/20 p-2 rounded-lg leading-normal">
                  {lang === 'ID' 
                    ? 'Asisten digital AURA dikemas khusus untuk kemudahan lansia pedesaan.'
                    : 'AURA digital companion is meticulously styled for senior citizen accessibility.'}
                </div>
              </div>
            )}
          </div>

          {/* PHYSICAL LOWER BACK / HOME SYSTEM NAVIGATION BUTTONS */}
          <div className="mt-2 pt-2 border-t border-slate-900/60 flex items-center justify-around text-slate-650 select-none">
            <button 
              onClick={() => {
                triggerAudioBeep();
                setScreen('DASHBOARD');
              }}
              className="px-3 py-1 hover:text-slate-300 text-xs font-black flex items-center gap-1 transition-colors"
              title={lang === 'ID' ? "Kembali ke Dashboard Beranda" : "Return to Dashboard Home"}
            >
              <Smartphone className="w-3.5 h-3.5" />
              {lang === 'ID' ? 'BERANDA' : 'HOME'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
