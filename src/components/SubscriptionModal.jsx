import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Search, 
  Globe, 
  Tag, 
  DollarSign, 
  Calendar, 
  Clock, 
  Sparkles, 
  Check, 
  Eye
} from 'lucide-react';
import { 
  POPULAR_SUBSCRIPTIONS, 
  CATEGORIES, 
  BILLING_CYCLES 
} from '../services/subscriptionData';
import { CURRENCIES, getCurrencySymbol } from '../services/currencies';

export default function SubscriptionModal({ isOpen, onClose, onSave, editingSubscription, defaultCurrency = 'USD' }) {
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [price, setPrice] = useState('');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [category, setCategory] = useState('entertainment');
  const [firstBillDate, setFirstBillDate] = useState('2026-07-01');
  const [color, setColor] = useState('#8b5cf6');
  const [logoUrl, setLogoUrl] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const autocompleteRef = useRef(null);

  // Load editing subscription if present
  useEffect(() => {
    if (editingSubscription) {
      setName(editingSubscription.name || '');
      setDomain(editingSubscription.domain || '');
      setPrice(editingSubscription.price || '');
      setBillingCycle(editingSubscription.billingCycle || 'monthly');
      setCategory(editingSubscription.category || 'entertainment');
      setFirstBillDate(editingSubscription.firstBillDate || '2026-07-01');
      setColor(editingSubscription.color || '#8b5cf6');
      setLogoUrl(editingSubscription.logoUrl || '');
    } else {
      // Defaults for new subscription
      setName('');
      setDomain('');
      setPrice('');
      setBillingCycle('monthly');
      setCategory('entertainment');
      setFirstBillDate('2026-07-01');
      setColor('#8b5cf6');
      setLogoUrl('');
    }
    setSuggestions([]);
    setShowSuggestions(false);
  }, [editingSubscription, isOpen]);

  // Handle autocomplete matching
  const handleNameChange = (val) => {
    setName(val);
    if (!val.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Filter local popular database
    const filtered = POPULAR_SUBSCRIPTIONS.filter(sub => 
      sub.name.toLowerCase().startsWith(val.toLowerCase()) ||
      sub.domain.toLowerCase().includes(val.toLowerCase())
    ).slice(0, 4);

    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  };

  // Select autocomplete suggestion
  const handleSelectSuggestion = (brand) => {
    setName(brand.name);
    setDomain(brand.domain);
    setCategory(brand.category);
    setColor(brand.color || '#8b5cf6');
    if (brand.defaultPrice) {
      setPrice(brand.defaultPrice.toString());
    }
    
    // Auto fetch logo from Google Favicon V2
    const fetchedLogo = `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${brand.domain}&size=128`;
    setLogoUrl(fetchedLogo);
    
    setShowSuggestions(false);
  };

  // Listen to domain change for manual url input
  const handleDomainBlur = () => {
    if (domain.trim() && !editingSubscription) {
      // Clean domain name (e.g. remove http)
      let cleaned = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
      setDomain(cleaned);
      setLogoUrl(`https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${cleaned}&size=128`);
    }
  };

  // Generate generic domain from name if user types custom
  const handleNameBlur = () => {
    // If no domain was entered and name exists, guess a domain
    if (!domain.trim() && name.trim() && !editingSubscription) {
      const guessedDomain = name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
      setDomain(guessedDomain);
      setLogoUrl(`https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${guessedDomain}&size=128`);
    }
  };

  // Close suggestions if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !price || parseFloat(price) <= 0) {
      return; // validate fields
    }

    const payload = {
      name: name.trim(),
      domain: domain.trim(),
      price: parseFloat(price),
      billingCycle,
      category,
      firstBillDate,
      color,
      logoUrl: logoUrl.trim()
    };

    if (editingSubscription) {
      payload.id = editingSubscription.id;
    }

    onSave(payload);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Blur Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={styles.backdrop}
          />

          {/* Sliding Bottom Sheet */}
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            style={styles.sheet}
            className="glass"
          >
            {/* Sheet Handle */}
            <div style={styles.sheetHandle} />

            <div style={styles.sheetHeader}>
              <h3 style={styles.sheetTitle}>
                {editingSubscription ? 'Edit Subscription' : 'Add Subscription'}
              </h3>
              <button onClick={onClose} style={styles.closeBtn}>
                <X size={18} color="#94a3b8" />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              
              {/* BRAND SEARCH & AUTOCOMPLETE */}
              <div style={styles.inputGroup} ref={autocompleteRef}>
                <label style={styles.label}>Subscription Name</label>
                <div style={styles.inputWrapper}>
                  <Search size={18} style={styles.inputIcon} />
                  <input 
                    type="text" 
                    placeholder="e.g. Netflix, Spotify, iCloud"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    onBlur={handleNameBlur}
                    style={styles.inputWithIcon}
                    required
                  />
                  {/* Dynamic Logo Preview */}
                  {logoUrl && (
                    <div style={styles.logoPreviewBadge}>
                      <img 
                        src={logoUrl} 
                        alt="logo" 
                        style={styles.previewLogoImg} 
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Autocomplete Dropdown */}
                <AnimatePresence>
                  {showSuggestions && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      style={styles.suggestionsContainer}
                      className="glass"
                    >
                      {suggestions.map(brand => (
                        <div 
                          key={brand.name} 
                          onClick={() => handleSelectSuggestion(brand)}
                          style={styles.suggestionItem}
                        >
                          <img 
                            src={`https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${brand.domain}&size=128`} 
                            alt={brand.name} 
                            style={styles.suggestionLogo}
                            onError={(e) => {
                              e.target.src = `https://www.google.com/s2/favicons?sz=64&domain=${brand.domain}`;
                            }}
                          />
                          <div style={styles.suggestionText}>
                            <div style={styles.suggestionName}>{brand.name}</div>
                            <div style={styles.suggestionDomain}>{brand.domain}</div>
                          </div>
                          <Sparkles size={14} color="#8b5cf6" style={{ marginLeft: 'auto' }} />
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* DOMAIN & WEBSITE (FOR LOGO FETCHING) */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>Website Domain (Optional)</label>
                <div style={styles.inputWrapper}>
                  <Globe size={18} style={styles.inputIcon} />
                  <input 
                    type="text" 
                    placeholder="e.g. netflix.com"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    onBlur={handleDomainBlur}
                    style={styles.inputWithIcon}
                  />
                </div>
              </div>

              {/* PRICE FIELD IN A ROW */}
              <div style={styles.formRow}>
                <div style={{ ...styles.inputGroup, flex: 1 }}>
                  <label style={styles.label}>Price</label>
                  <div style={styles.inputWrapper}>
                    <span style={styles.currencyPrefixSymbol}>{getCurrencySymbol(defaultCurrency)}</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0.01"
                      placeholder="0.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      style={{ ...styles.input, paddingLeft: '32px' }}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* BILLING CYCLE & CATEGORY IN A ROW */}
              <div style={styles.formRow}>
                <div style={{ ...styles.inputGroup, flex: 1 }}>
                  <label style={styles.label}>Billing Cycle</label>
                  <div style={styles.inputWrapper}>
                    <Clock size={18} style={styles.inputIcon} />
                    <select 
                      value={billingCycle}
                      onChange={(e) => setBillingCycle(e.target.value)}
                      style={{ ...styles.select, paddingLeft: '42px' }}
                    >
                      {BILLING_CYCLES.map(cycle => (
                        <option key={cycle.id} value={cycle.id}>{cycle.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ ...styles.inputGroup, flex: 1 }}>
                  <label style={styles.label}>Category</label>
                  <div style={styles.inputWrapper}>
                    <Tag size={18} style={styles.inputIcon} />
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      style={{ ...styles.select, paddingLeft: '42px' }}
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* FIRST BILL DATE */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>First Bill Date</label>
                <div style={styles.inputWrapper}>
                  <Calendar size={18} style={styles.inputIcon} />
                  <input 
                    type="date" 
                    value={firstBillDate}
                    onChange={(e) => setFirstBillDate(e.target.value)}
                    style={{ ...styles.input, paddingLeft: '42px' }}
                    required
                  />
                </div>
              </div>

              {/* BRAND COLOR SELECTOR */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>Theme Brand Color</label>
                <div style={styles.colorSelectorRow}>
                  {['#8b5cf6', '#10b981', '#3b82f6', '#ec4899', '#f59e0b', '#ef4444', '#14b8a6', '#f43f5e'].map(col => (
                    <div 
                      key={col} 
                      onClick={() => setColor(col)}
                      style={{
                        ...styles.colorCircle,
                        backgroundColor: col,
                        border: color === col ? '3px solid #fff' : '1px solid rgba(255,255,255,0.1)',
                        transform: color === col ? 'scale(1.15)' : 'none'
                      }}
                    >
                      {color === col && <Check size={12} color="#fff" />}
                    </div>
                  ))}
                  <input 
                    type="color" 
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    style={styles.customColorInput}
                  />
                </div>
              </div>

              {/* SAVE BUTTON */}
              <button type="submit" style={styles.saveBtn}>
                {editingSubscription ? 'Save Changes' : 'Add Subscription'}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

const styles = {
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    zIndex: 998,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '92%',
    borderTopLeftRadius: '32px',
    borderTopRightRadius: '32px',
    padding: '24px 20px',
    backgroundColor: '#121214',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderBottom: 'none',
    zIndex: 999,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
  sheetHandle: {
    width: '40px',
    height: '4px',
    background: 'rgba(255, 255, 255, 0.15)',
    borderRadius: '2px',
    margin: '0 auto 20px auto',
  },
  sheetHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  sheetTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#f8fafc',
  },
  closeBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.04)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    paddingBottom: 'calc(24px + var(--safe-bottom))',
  },
  formRow: {
    display: 'flex',
    gap: '12px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    position: 'relative',
  },
  label: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    color: '#64748b',
    pointerEvents: 'none',
  },
  inputWithIcon: {
    paddingLeft: '42px',
    paddingRight: '48px', // space for logo preview
  },
  input: {
    width: '100%',
  },
  select: {
    width: '100%',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 14px center',
    backgroundSize: '16px',
  },
  logoPreviewBadge: {
    position: 'absolute',
    right: '12px',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewLogoImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '6px',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backgroundColor: '#16161a',
    zIndex: 1000,
    overflow: 'hidden',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
  },
  suggestionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    cursor: 'pointer',
    transition: 'background 0.2s',
    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
    ':last-child': {
      borderBottom: 'none',
    }
  },
  suggestionLogo: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    objectFit: 'cover',
    background: '#121214',
  },
  suggestionText: {
    display: 'flex',
    flexDirection: 'column',
  },
  suggestionName: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#f8fafc',
  },
  suggestionDomain: {
    fontSize: '0.725rem',
    color: '#64748b',
  },
  colorSelectorRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: '4px',
  },
  colorCircle: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.1s',
  },
  customColorInput: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    padding: 0,
    border: 'none',
    cursor: 'pointer',
    background: 'none',
    marginLeft: 'auto',
    outline: 'none',
  },
  saveBtn: {
    background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    color: '#fff',
    padding: '14px',
    fontSize: '1rem',
    marginTop: '16px',
    boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)',
  },
  currencyPrefixSymbol: {
    position: 'absolute',
    left: '14px',
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: '1rem',
    pointerEvents: 'none',
  }
};
