import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { authService } from '../firebase';
import { Mail, Lock, ShieldAlert, Sparkles, UserCheck, Coins } from 'lucide-react';
import { CURRENCIES } from '../services/currencies';

export default function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await authService.signInWithEmailAndPassword(email, password);
      } else {
        await authService.createUserWithEmailAndPassword(email, password, selectedCurrency);
      }
      onAuthSuccess();
    } catch (err) {
      console.error(err);
      if (err.message.includes('email-already-in-use')) {
        setError('Email already registered.');
      } else if (err.message.includes('wrong-password-or-user-not-found') || err.message.includes('user-not-found')) {
        setError('Incorrect email or password.');
      } else {
        setError('Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestMode = async () => {
    setLoading(true);
    setError('');
    try {
      await authService.signInAnonymously(selectedCurrency);
      onAuthSuccess();
    } catch (err) {
      console.error(err);
      setError('Failed to enter guest mode.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="glass" 
        style={styles.card}
      >
        {/* App Title & Branding */}
        <div style={styles.brandContainer}>
          <div style={styles.logoBadge}>
            <Sparkles size={24} color="#8b5cf6" />
          </div>
          <h1 style={styles.brandTitle}>SubSpace</h1>
          <p style={styles.brandTagline}>Take control of your digital recurring spend</p>
        </div>

        {/* Auth Mode Tabs */}
        <div style={styles.tabs}>
          <button 
            style={{
              ...styles.tabBtn,
              color: isLogin ? '#fff' : '#64748b',
              background: isLogin ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
              border: isLogin ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid transparent'
            }}
            onClick={() => { setIsLogin(true); setError(''); }}
          >
            Login
          </button>
          <button 
            style={{
              ...styles.tabBtn,
              color: !isLogin ? '#fff' : '#64748b',
              background: !isLogin ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
              border: !isLogin ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid transparent'
            }}
            onClick={() => { setIsLogin(false); setError(''); }}
          >
            Register
          </button>
        </div>

        {/* Error Display */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={styles.errorContainer}
            >
              <ShieldAlert size={16} color="#ef4444" />
              <span style={styles.errorText}>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputWrapper}>
            <Mail size={18} style={styles.inputIcon} />
            <input 
              type="email" 
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div style={styles.inputWrapper}>
            <Lock size={18} style={styles.inputIcon} />
            <input 
              type="password" 
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          {!isLogin && (
            <div style={styles.inputWrapper}>
              <Coins size={18} style={styles.inputIcon} />
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                style={{ ...styles.select, paddingLeft: '48px' }}
                disabled={loading}
              >
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <button 
            type="submit" 
            style={{
              ...styles.submitBtn,
              opacity: loading ? 0.7 : 1
            }}
            disabled={loading}
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        {/* <div style={styles.divider}>
          <span style={styles.dividerLine}></span>
          <span style={styles.dividerText}>or</span>
          <span style={styles.dividerLine}></span>
        </div> */}

        {/* Guest Access Option */}
        {/* <div style={styles.guestCurrencyWrapper}>
          <span style={styles.guestCurrencyLabel}>Choose Guest Currency</span>
          <div style={styles.inputWrapper}>
            <Coins size={16} style={styles.inputIcon} />
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              style={{ ...styles.guestSelect, paddingLeft: '48px' }}
              disabled={loading}
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>
        </div> */}

        {/* <button 
          onClick={handleGuestMode} 
          style={styles.guestBtn}
          disabled={loading}
        >
          <UserCheck size={18} style={{ marginRight: 8 }} />
          Continue as Guest (Try Offline)
        </button> */}
      </motion.div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '24px',
    background: 'radial-gradient(circle at top, #1e1b4b 0%, #09090b 100%)',
    overflowY: 'auto',
  },
  card: {
    width: '100%',
    padding: '32px 24px',
    borderRadius: '28px',
    display: 'flex',
    flexDirection: 'column',
  },
  brandContainer: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  logoBadge: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    background: 'rgba(139, 92, 246, 0.1)',
    border: '1px solid rgba(139, 92, 246, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px auto',
  },
  brandTitle: {
    fontSize: '2rem',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #fff 0%, #a78bfa 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.5px',
    marginBottom: '8px',
  },
  brandTagline: {
    fontSize: '0.875rem',
    color: '#94a3b8',
    lineHeight: '1.4',
  },
  tabs: {
    display: 'flex',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '14px',
    padding: '4px',
    marginBottom: '24px',
    border: '1px solid rgba(255, 255, 255, 0.04)',
  },
  tabBtn: {
    flex: 1,
    padding: '10px 0',
    fontSize: '0.875rem',
    fontWeight: '600',
    borderRadius: '10px',
  },
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '12px',
    padding: '12px 16px',
    marginBottom: '20px',
    overflow: 'hidden',
  },
  errorText: {
    fontSize: '0.85rem',
    color: '#f87171',
    fontWeight: '500',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '16px',
    color: '#64748b',
    pointerEvents: 'none',
  },
  input: {
    paddingLeft: '48px',
  },
  submitBtn: {
    background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    color: '#fff',
    padding: '14px',
    fontSize: '1rem',
    marginTop: '8px',
    boxShadow: '0 4px 20px rgba(139, 92, 246, 0.35)',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '24px 0',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: 'rgba(255, 255, 255, 0.08)',
  },
  dividerText: {
    padding: '0 12px',
    fontSize: '0.875rem',
    color: '#475569',
  },
  guestBtn: {
    background: 'rgba(255, 255, 255, 0.04)',
    color: '#cbd5e1',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    padding: '14px',
    fontSize: '0.925rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  select: {
    paddingLeft: '48px',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 14px center',
    backgroundSize: '16px',
    width: '100%',
  },
  guestCurrencyWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '14px',
  },
  guestCurrencyLabel: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  guestSelect: {
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 14px center',
    backgroundSize: '16px',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  }
};
