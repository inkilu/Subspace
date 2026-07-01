import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Calendar, 
  Layers, 
  Plus, 
  DollarSign, 
  AlertCircle,
  ChevronRight,
  TrendingDown,
  Edit2
} from 'lucide-react';
import { CATEGORIES } from '../services/subscriptionData';
import { getCurrencySymbol } from '../services/currencies';

// Utility helper to normalize cost to monthly
export const getMonthlyEquivalent = (price, cycle) => {
  const numPrice = parseFloat(price) || 0;
  switch (cycle) {
    case 'weekly':
      return numPrice * (52 / 12);
    case 'yearly':
      return numPrice / 12;
    case 'monthly':
    default:
      return numPrice;
  }
};

// Utility to calculate days until next renewal
export const getRenewalDetails = (startDateStr, cycle) => {
  const today = new Date('2026-07-01'); // Lock to current local context date
  const start = new Date(startDateStr);
  
  if (isNaN(start.getTime())) {
    return { daysLeft: 0, nextDate: today };
  }
  
  let nextDate = new Date(start);
  
  while (nextDate < today) {
    if (cycle === 'weekly') {
      nextDate.setDate(nextDate.getDate() + 7);
    } else if (cycle === 'yearly') {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    } else { // monthly
      nextDate.setMonth(nextDate.getMonth() + 1);
    }
  }
  
  const diffTime = nextDate - today;
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return {
    daysLeft,
    nextDate: nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  };
};

export default function Dashboard({ subscriptions, onAddClick, onSelectSubscription, userCurrency = 'USD', budgetLimit = 250, onEditBudgetLimit }) {
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [tempLimit, setTempLimit] = useState(budgetLimit.toString());

  // Sync input when prop updates
  useEffect(() => {
    setTempLimit(budgetLimit.toString());
  }, [budgetLimit]);

  const handleSaveLimit = () => {
    const parsed = parseFloat(tempLimit);
    if (!isNaN(parsed) && parsed > 0) {
      onEditBudgetLimit(parsed);
    }
    setIsEditingLimit(false);
  };
  
  // Calculate normalized total monthly spend
  const totalMonthlySpend = subscriptions.reduce((sum, sub) => {
    return sum + getMonthlyEquivalent(sub.price, sub.billingCycle);
  }, 0);

  // Budget progress percentage
  const budgetPercentage = Math.min(Math.round((totalMonthlySpend / budgetLimit) * 100), 100);

  // Group and calculate spend by category
  const categoryTotals = CATEGORIES.reduce((acc, cat) => {
    acc[cat.id] = 0;
    return acc;
  }, {});

  subscriptions.forEach(sub => {
    const monthlyCost = getMonthlyEquivalent(sub.price, sub.billingCycle);
    const catId = sub.category || 'other';
    if (categoryTotals[catId] !== undefined) {
      categoryTotals[catId] += monthlyCost;
    } else {
      categoryTotals['other'] += monthlyCost;
    }
  });

  // Calculate upcoming renewals (due in next 10 days)
  const upcomingSubscriptions = subscriptions
    .map(sub => {
      const renewalInfo = getRenewalDetails(sub.firstBillDate, sub.billingCycle);
      return { ...sub, ...renewalInfo };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const urgentRenewals = upcomingSubscriptions.filter(s => s.daysLeft <= 10);

  return (
    <div style={styles.container} className="no-scrollbar">
      {/* Premium Header */}
      <header style={styles.header}>
        <div>
          <span style={styles.welcomeText}>OVERVIEW</span>
          <h2 style={styles.headerTitle}>My Spending</h2>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAddClick} 
          style={styles.addBtn}
        >
          <Plus size={20} color="#fff" />
        </motion.button>
      </header>

      {/* Main Stats Card (Glassmorphic Glow) */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="glass pulse-glow" 
        style={styles.statsCard}
      >
        <div style={styles.statsMain}>
          <div>
            <span style={styles.cardLabel}>TOTAL MONTHLY EST.</span>
            <div style={styles.priceContainer}>
              <span style={styles.currency}>{getCurrencySymbol(userCurrency)}</span>
              <h1 style={styles.price}>{totalMonthlySpend.toFixed(2)}</h1>
            </div>
            {isEditingLimit ? (
              <div style={styles.inlineEditWrapper}>
                <span style={styles.inlineEditPercent}>{budgetPercentage}% of </span>
                <span style={styles.currencyPrefix}>{getCurrencySymbol(userCurrency)}</span>
                <input 
                  type="number"
                  value={tempLimit}
                  onChange={(e) => setTempLimit(e.target.value)}
                  onBlur={handleSaveLimit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveLimit();
                    if (e.key === 'Escape') setIsEditingLimit(false);
                  }}
                  autoFocus
                  style={styles.inlineEditInput}
                />
                <span style={styles.inlineEditSuffix}> limit</span>
              </div>
            ) : (
              <p style={styles.budgetStatus} onClick={() => setIsEditingLimit(true)}>
                {budgetPercentage}% of <span style={styles.budgetHighlight}>{getCurrencySymbol(userCurrency)}{budgetLimit}</span> monthly limit
                <Edit2 size={12} style={styles.editIcon} />
              </p>
            )}
          </div>
          
          {/* SVG Progress Ring */}
          <div style={styles.progressRingWrapper}>
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle 
                cx="40" 
                cy="40" 
                r="34" 
                stroke="rgba(255,255,255,0.05)" 
                strokeWidth="6" 
                fill="transparent" 
              />
              <motion.circle 
                cx="40" 
                cy="40" 
                r="34" 
                stroke="url(#purpleGradient)" 
                strokeWidth="6" 
                fill="transparent" 
                strokeDasharray={2 * Math.PI * 34}
                initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - budgetPercentage / 100) }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <div style={styles.progressText}>{budgetPercentage}%</div>
          </div>
        </div>

        <div style={styles.statsFooter}>
          <div style={styles.footerItem}>
            <TrendingUp size={16} color="#10b981" />
            <span style={{ marginLeft: 6 }}>{subscriptions.length} Active Subs</span>
          </div>
          <span style={styles.footerDivider}></span>
          <div style={styles.footerItem}>
            <Calendar size={16} color="#3b82f6" />
            <span style={{ marginLeft: 6 }}>
              Avg. {getCurrencySymbol(userCurrency)}{(subscriptions.length ? totalMonthlySpend / subscriptions.length : 0).toFixed(1)}/sub
            </span>
          </div>
        </div>
      </motion.div>

      {/* Upcoming Renewals Carousel */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>Renewals Soon</h3>
          <span style={styles.sectionAction}>Next 10 days</span>
        </div>

        {urgentRenewals.length === 0 ? (
          <div className="glass" style={styles.emptyRenewals}>
            <AlertCircle size={20} color="#64748b" style={{ marginBottom: 6 }} />
            <span>No renewals due in the next 10 days</span>
          </div>
        ) : (
          <div style={styles.carousel} className="no-scrollbar">
            {urgentRenewals.map(sub => {
              const brandColor = sub.color || '#8b5cf6';
              return (
                <motion.div 
                  key={sub.id} 
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onSelectSubscription(sub)}
                  style={{
                    ...styles.carouselCard,
                    borderLeft: `4px solid ${brandColor}`
                  }}
                  className="glass"
                >
                  <div style={styles.carouselHeader}>
                    {sub.logoUrl ? (
                      <img src={sub.logoUrl} alt={sub.name} style={styles.carouselLogo} />
                    ) : (
                      <div style={{ ...styles.carouselAvatar, backgroundColor: brandColor }}>
                        {sub.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h4 style={styles.carouselName}>{sub.name}</h4>
                      <span style={styles.carouselCycle}>due in {sub.daysLeft} days</span>
                    </div>
                  </div>
                  <div style={styles.carouselFooter}>
                    <span style={styles.carouselPrice}>{getCurrencySymbol(userCurrency)}{parseFloat(sub.price).toFixed(2)}</span>
                    <span style={styles.carouselDate}>{sub.nextDate}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Category Breakdown list */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>Expense breakdown</h3>
          <Layers size={18} color="#94a3b8" />
        </div>

        <div style={styles.categoryList} className="glass">
          {CATEGORIES.map(cat => {
            const cost = categoryTotals[cat.id] || 0;
            const percentage = totalMonthlySpend > 0 ? (cost / totalMonthlySpend) * 100 : 0;
            if (cost === 0) return null;

            return (
              <div key={cat.id} style={styles.categoryRow}>
                <div style={styles.categoryMeta}>
                  <div style={styles.categoryLabelGroup}>
                    <span style={{ ...styles.categoryDot, backgroundColor: cat.color }}></span>
                    <span style={styles.categoryNameText}>{cat.label}</span>
                  </div>
                  <span style={styles.categoryCost}>{getCurrencySymbol(userCurrency)}{cost.toFixed(2)}/mo</span>
                </div>
                
                {/* Visual Custom Progress bar */}
                <div style={styles.progressBarBg}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{
                      ...styles.progressBarFill,
                      backgroundColor: cat.color
                    }}
                  />
                </div>
              </div>
            );
          })}

          {subscriptions.length === 0 && (
            <div style={styles.emptyCategories}>
              <span>Create your first subscription to see the category breakdown</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

const styles = {
  container: {
    flex: 1,
    padding: '24px 20px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    paddingBottom: '32px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '8px',
  },
  welcomeText: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#8b5cf6',
    letterSpacing: '1.5px',
  },
  headerTitle: {
    fontSize: '1.75rem',
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: '-0.5px',
  },
  addBtn: {
    width: '46px',
    height: '46px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
  },
  statsCard: {
    borderRadius: '24px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  statsMain: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#94a3b8',
    letterSpacing: '1px',
  },
  priceContainer: {
    display: 'flex',
    alignItems: 'baseline',
    marginTop: '6px',
  },
  currency: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#a78bfa',
    marginRight: '2px',
  },
  price: {
    fontSize: '2.5rem',
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: '-1px',
    lineHeight: '1',
  },
  budgetStatus: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    marginTop: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    cursor: 'pointer',
  },
  budgetHighlight: {
    color: 'var(--primary)',
    fontWeight: '700',
    textDecoration: 'underline',
    textDecorationStyle: 'dotted',
  },
  editIcon: {
    color: '#64748b',
    marginLeft: '2px',
  },
  inlineEditWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    marginTop: '8px',
    fontSize: '0.85rem',
    color: '#94a3b8',
  },
  inlineEditPercent: {
    color: '#94a3b8',
  },
  currencyPrefix: {
    color: 'var(--primary)',
    fontWeight: '700',
    marginRight: '2px',
  },
  inlineEditInput: {
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid var(--primary)',
    borderRadius: '6px',
    padding: '2px 6px',
    width: '64px',
    color: '#fff',
    fontSize: '0.85rem',
    fontWeight: '700',
    outline: 'none',
  },
  inlineEditSuffix: {
    color: '#94a3b8',
  },
  progressRingWrapper: {
    position: 'relative',
    width: '80px',
    height: '80px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    position: 'absolute',
    fontSize: '0.9rem',
    fontWeight: '700',
    color: '#f8fafc',
  },
  statsFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    paddingTop: '16px',
  },
  footerItem: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.875rem',
    color: '#cbd5e1',
  },
  footerDivider: {
    width: '1px',
    height: '16px',
    background: 'rgba(255,255,255,0.08)',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: '1.15rem',
    fontWeight: '700',
    color: '#f8fafc',
    letterSpacing: '-0.3px',
  },
  sectionAction: {
    fontSize: '0.8rem',
    color: '#8b5cf6',
    fontWeight: '600',
  },
  emptyRenewals: {
    borderRadius: '16px',
    padding: '24px',
    textAlign: 'center',
    color: '#64748b',
    fontSize: '0.875rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  carousel: {
    display: 'flex',
    gap: '12px',
    overflowX: 'auto',
    paddingBottom: '8px',
  },
  carouselCard: {
    flex: '0 0 160px',
    borderRadius: '16px',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '110px',
    cursor: 'pointer',
  },
  carouselHeader: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  carouselLogo: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    objectFit: 'cover',
    background: '#18181b',
  },
  carouselAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    color: '#fff',
    fontSize: '0.9rem',
  },
  carouselName: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#f8fafc',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '100px',
  },
  carouselCycle: {
    fontSize: '0.7rem',
    color: '#ef4444',
    fontWeight: '500',
    display: 'block',
  },
  carouselFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 'auto',
  },
  carouselPrice: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#f8fafc',
  },
  carouselDate: {
    fontSize: '0.675rem',
    color: '#94a3b8',
  },
  categoryList: {
    borderRadius: '20px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  categoryRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  categoryMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryLabelGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  categoryDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  categoryNameText: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#e2e8f0',
  },
  categoryCost: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#cbd5e1',
  },
  progressBarBg: {
    height: '6px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '3px',
  },
  emptyCategories: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: '0.85rem',
    padding: '12px 0',
  }
};
