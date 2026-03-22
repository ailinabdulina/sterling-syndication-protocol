import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, User } from 'firebase/auth';
import { wdk } from '../services/wdk';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  walletAddress: string | null;
  walletBalance: string; // USDT Balance
  nativeBalance: string; // ETH Balance
  refreshBalance: () => Promise<void>;
  requestPin: (reason: string) => Promise<string>;
  ensureWallet: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // WDK Wallet State
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<string>("0.00");
  const [nativeBalance, setNativeBalance] = useState<string>("0.0000");

  // PIN Modal State
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinReason, setPinReason] = useState("");
  const [pinInputs, setPinInputs] = useState<string[]>(Array(6).fill(""));
  const [pinResolver, setPinResolver] = useState<((pin: string) => void) | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const requestPin = (reason: string): Promise<string> => {
    return new Promise((resolve) => {
      setPinReason(reason);
      setPinInputs(Array(6).fill(""));
      setPinResolver(() => resolve);
      setPinModalOpen(true);
      // Focus first input after a short delay to ensure modal is rendered
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    });
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pin = pinInputs.join('');
    if (pin.length === 6 && pinResolver) {
      pinResolver(pin);
      setPinModalOpen(false);
      setPinResolver(null);
    }
  };

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newPin = [...pinInputs];
    newPin[index] = value.slice(-1);
    setPinInputs(newPin);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pinInputs[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      const newPin = [...pinInputs];
      for (let i = 0; i < pastedData.length; i++) {
        newPin[i] = pastedData[i];
      }
      setPinInputs(newPin);
      const nextIndex = Math.min(pastedData.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const refreshBalance = async (uid?: string) => {
    const targetUid = uid || user?.uid;
    if (targetUid) {
      const usdtBal = await wdk.getUsdtBalance(targetUid);
      const ethBal = await wdk.getNativeBalance(targetUid);
      setWalletBalance(usdtBal);
      setNativeBalance(ethBal);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        // 1. Check if WDK Wallet exists
        let address = await wdk.getWalletAddress(u.uid);
        
        if (!address) {
          // Prompt to create wallet
          try {
            const pin = await requestPin("Create a 6-digit PIN to secure your new Web3 wallet.");
            if (pin) {
              address = await wdk.createWallet(u.uid, pin);
            }
          } catch (e) {
            console.error("Error creating/unlocking wallet:", e);
          }
        }

        if (address) {
          setWalletAddress(address);
          // 2. Fetch initial balance from Sepolia
          await refreshBalance(u.uid);
        }
      } else {
        setWalletAddress(null);
        setWalletBalance("0.00");
        setNativeBalance("0.0000");
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const ensureWallet = async (): Promise<string | null> => {
    if (!user) return null;
    
    try {
      let address = await wdk.getWalletAddress(user.uid);
      
      // If we have an address but the wallet isn't unlocked in memory, we need the PIN to unlock it
      if (address && !wdk.isWalletUnlocked(user.uid)) {
        const pin = await requestPin("Enter your 6-digit PIN to unlock your Web3 wallet.");
        if (pin) {
          await wdk.unlockWallet(user.uid, pin);
        } else {
          return null; // User cancelled PIN entry
        }
      }

      // If we don't have an address, we need to create a new wallet
      if (!address) {
        const pin = await requestPin("Create a 6-digit PIN to secure your new Web3 wallet.");
        if (pin) {
          address = await wdk.createWallet(user.uid, pin);
        } else {
          return null; // User cancelled PIN entry
        }
      }
      
      if (address && wdk.isWalletUnlocked(user.uid)) {
        setWalletAddress(address);
        await refreshBalance(user.uid);
        return address;
      }
    } catch (e) {
      console.error("Error creating/unlocking wallet in ensureWallet:", e);
    }
    return null;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      loginWithGoogle, 
      logout, 
      walletAddress, 
      walletBalance,
      nativeBalance,
      refreshBalance,
      requestPin,
      ensureWallet
    }}>
      {children}
      
      {/* Global PIN Modal */}
      {pinModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border-[3px] border-black rounded-xl p-6 sm:p-8 w-full max-w-sm shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-2xl font-black text-black uppercase tracking-widest mb-2">Wallet Security</h3>
            <p className="text-sm font-bold text-black/80 mb-6">{pinReason}</p>
            
            <form onSubmit={handlePinSubmit}>
              <div className="mb-8">
                <label className="block text-xs font-black text-black uppercase tracking-widest mb-4 text-center">
                  Enter 6-Digit PIN
                </label>
                <div className="flex justify-center gap-2" onPaste={handlePaste}>
                  {pinInputs.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="password"
                      inputMode="numeric"
                      value={digit}
                      onChange={(e) => handlePinChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-10 h-14 sm:w-12 sm:h-16 bg-[#E4E3E0] border-[3px] border-black rounded-xl text-black text-center text-2xl font-black focus:outline-none focus:bg-white focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                      maxLength={2}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPinModalOpen(false);
                    if (pinResolver) pinResolver(""); // Cancel returns empty string
                    setPinResolver(null);
                  }}
                  className="flex-1 px-4 py-3 bg-white border-[3px] border-black rounded-xl font-black text-black uppercase tracking-widest hover:bg-gray-50 active:translate-y-[2px] active:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pinInputs.join('').length < 6}
                  className="flex-1 px-4 py-3 bg-[#86F29F] border-[3px] border-black rounded-xl font-black text-black uppercase tracking-widest hover:bg-[#75d68b] disabled:opacity-50 disabled:hover:bg-[#86F29F] disabled:cursor-not-allowed active:translate-y-[2px] active:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
