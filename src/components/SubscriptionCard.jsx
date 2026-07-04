import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Calendar } from 'lucide-react';
import { getRenewalDetails } from './Dashboard';
import { CATEGORIES } from '../services/subscriptionData';

export default function SubscriptionCard({ subscription, onDelete, onClick, currencySymbol = '$' }) {
  const [isSwiped, setIsSwiped] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const currentOffset = useRef(0);
  const isHorizontalSwipe = useRef(null);

  const renewalInfo = getRenewalDetails(subscription.firstBillDate, subscription.billingCycle);
  const brandColor = subscription.color || '#8b5cf6';
  
  // Find category label
  const catObj = CATEGORIES.find(c => c.id === subscription.category) || { label: 'Other' };

  // Handle touch interactions
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    currentOffset.current = isSwiped ? -80 : 0;
    setIsDragging(true);
    isHorizontalSwipe.current = null; // Reset swipe direction detection
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;

    const diffX = e.touches[0].clientX - touchStartX.current;
    const diffY = e.touches[0].clientY - touchStartY.current;

    // Detect gesture direction on first moves
    if (isHorizontalSwipe.current === null) {
      if (Math.abs(diffX) > Math.abs(diffY)) {
        isHorizontalSwipe.current = true;
      } else if (Math.abs(diffY) > 5) {
        isHorizontalSwipe.current = false;
      }
    }

    // If swiping vertically, let body scrolling handle it
    if (isHorizontalSwipe.current === false) {
      return;
    }

    // Prevent screen scroll while swiping card horizontally
    if (e.cancelable) {
      e.preventDefault();
    }

    let newOffset = currentOffset.current + diffX;
    
    // Apply boundaries with elastic rubber-banding limits
    if (newOffset > 0) {
      newOffset = newOffset * 0.15; // Swiping right resistance
    } else if (newOffset < -80) {
      newOffset = -80 + (newOffset + 80) * 0.15; // Swiping left past action button resistance
    }

    setSwipeOffset(newOffset);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // Snap to swiped state or closed state depending on threshold
    if (swipeOffset < -40) {
      setIsSwiped(true);
      setSwipeOffset(-80);
    } else {
      setIsSwiped(false);
      setSwipeOffset(0);
    }
  };

  const closeSwipe = () => {
    setIsSwiped(false);
    setSwipeOffset(0);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete(subscription.id);
  };

  const handleCardClick = () => {
    if (isSwiped) {
      closeSwipe();
    } else if (onClick) {
      onClick(subscription);
    }
  };

  return (
    <div style={styles.outerContainer} className="swipe-item-container">
      {/* Background delete trigger revealed on swipe */}
      <div style={styles.actionBackground} className="swipe-background">
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={handleDeleteClick}
          style={styles.deleteButton}
        >
          <Trash2 size={20} color="#fff" />
        </motion.button>
      </div>

      {/* Foreground card */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onClick={handleCardClick}
        style={{
          ...styles.cardForeground,
          borderLeft: `5px solid ${brandColor}`,
          transform: `translateX(${swipeOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="glass swipe-foreground"
      >
        <div style={styles.mainInfo}>
          {/* Logo / Brand Image */}
          {subscription.logoUrl ? (
            <img 
              src={subscription.logoUrl} 
              alt={subscription.name} 
              style={styles.logo}
              onError={(e) => {
                // Fallback to letter avatar if logo fails to load
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          
          <div 
            style={{ 
              ...styles.avatar, 
              backgroundColor: brandColor,
              display: subscription.logoUrl ? 'none' : 'flex' 
            }}
          >
            {subscription.name.charAt(0).toUpperCase()}
          </div>

          <div style={styles.nameDetails}>
            <h4 style={styles.name}>{subscription.name}</h4>
            <div style={styles.metaRow}>
              <span className={`badge-${subscription.category || 'other'}`} style={styles.categoryBadge}>
                {catObj.label}
              </span>
              <span style={styles.cycleText}>
                {subscription.billingCycle.toLowerCase()}
              </span>
            </div>
          </div>
        </div>

        <div style={styles.financials}>
          <div style={styles.priceContainer}>
            <span style={styles.currencySymbol}>{currencySymbol}</span>
            <span style={styles.price}>{parseFloat(subscription.price).toFixed(2)}</span>
          </div>
          
          {/* Due status */}
          <div style={styles.dueStatus}>
            <Calendar size={12} color={renewalInfo.daysLeft <= 3 ? '#ef4444' : '#64748b'} />
            <span style={{ 
              ...styles.dueText,
              color: renewalInfo.daysLeft <= 3 ? '#f87171' : '#94a3b8',
              fontWeight: renewalInfo.daysLeft <= 3 ? '600' : '400'
            }}>
              {renewalInfo.daysLeft === 0 ? 'Today' : `in ${renewalInfo.daysLeft}d`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  outerContainer: {
    position: 'relative',
    height: '84px',
    borderRadius: '16px',
    backgroundColor: '#000',
    overflow: 'hidden',
    touchAction: 'pan-y'
  },
  actionBackground: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingRight: '22px',
    backgroundColor: '#ef4444',
    borderRadius: '16px',
    zIndex: 1
  },
  deleteButton: {
    background: 'transparent',
    border: 'none',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardForeground: {
    position: 'relative',
    zIndex: 2,
    height: '100%',
    padding: '16px 20px',
    borderRadius: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    backgroundColor: '#121214',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  mainInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flex: 1,
    overflow: 'hidden',
  },
  logo: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    objectFit: 'cover',
    background: '#18181b',
    border: '1px solid rgba(255, 255, 255, 0.08)'
  },
  avatar: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    color: '#fff',
    fontSize: '1.2rem',
  },
  nameDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    overflow: 'hidden',
  },
  name: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#f8fafc',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  categoryBadge: {
    fontSize: '0.675rem',
    padding: '2px 8px',
    borderRadius: '6px',
    fontWeight: '500',
  },
  cycleText: {
    fontSize: '0.725rem',
    color: '#64748b',
    textTransform: 'capitalize',
  },
  financials: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '4px',
    marginLeft: '12px',
  },
  priceContainer: {
    display: 'flex',
    alignItems: 'baseline',
  },
  currencySymbol: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#a78bfa',
    marginRight: '1px',
  },
  price: {
    fontSize: '1.15rem',
    fontWeight: '700',
    color: '#f8fafc',
  },
  dueStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  dueText: {
    fontSize: '0.75rem',
  }
};
