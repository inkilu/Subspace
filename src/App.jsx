import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  authService, 
  databaseService, 
  useMock 
} from './firebase';
import { 
  LayoutDashboard, 
  CreditCard, 
  Plus, 
  LogOut, 
  Sparkles,
  Search,
  SlidersHorizontal,
  FolderMinus
} from 'lucide-react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import SubscriptionCard from './components/SubscriptionCard';
import SubscriptionModal from './components/SubscriptionModal';
import { CATEGORIES } from './services/subscriptionData';
import { getCurrencySymbol } from './services/currencies';

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userCurrency, setUserCurrency] = useState('USD');
  const [budgetLimit, setBudgetLimit] = useState(250);
  const [subscriptions, setSubscriptions] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'list'
  const [actionLoading, setActionLoading] = useState(false);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState(null);

  // Search & filter states for the List tab
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('price-desc'); // 'price-desc' | 'price-asc' | 'date-soon' | 'name-asc'

  // Firebase Auth listener
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setUserCurrency(currentUser.currency || 'USD');
        setBudgetLimit(currentUser.budgetLimit !== undefined ? currentUser.budgetLimit : 250);
      } else {
        setUserCurrency('USD');
        setBudgetLimit(250);
      }
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // Fetch subscriptions when user changes
  useEffect(() => {
    if (user) {
      fetchSubs();
    } else {
      setSubscriptions([]);
    }
  }, [user]);

  const fetchSubs = async () => {
    try {
      const data = await databaseService.getSubscriptions(user.uid);
      
      // If mock mode is active and guest/new user has 0 subscriptions, pre-populate 3 sample items
      if (data.length === 0 && useMock) {
        const today = new Date('2026-07-01');
        
        // Generate bill dates that are slightly offset
        const dateNetflix = new Date(today);
        dateNetflix.setDate(today.getDate() - 25); // next due in 5 days
        
        const dateSpotify = new Date(today);
        dateSpotify.setDate(today.getDate() - 29); // next due in 2 days (due to 31-day month logic)
        
        const dateChatGpt = new Date(today);
        dateChatGpt.setDate(today.getDate() - 10); // next due in 20 days

        const samples = [
          {
            name: 'Netflix',
            domain: 'netflix.com',
            price: 15.49,
            billingCycle: 'monthly',
            category: 'entertainment',
            firstBillDate: dateNetflix.toISOString().split('T')[0],
            color: '#e50914',
            logoUrl: 'https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://netflix.com&size=128',
            userId: user.uid
          },
          {
            name: 'Spotify',
            domain: 'spotify.com',
            price: 11.99,
            billingCycle: 'monthly',
            category: 'music',
            firstBillDate: dateSpotify.toISOString().split('T')[0],
            color: '#1db954',
            logoUrl: 'https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://spotify.com&size=128',
            userId: user.uid
          },
          {
            name: 'ChatGPT Plus',
            domain: 'openai.com',
            price: 20.00,
            billingCycle: 'monthly',
            category: 'productivity',
            firstBillDate: dateChatGpt.toISOString().split('T')[0],
            color: '#10a37f',
            logoUrl: 'https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://openai.com&size=128',
            userId: user.uid
          }
        ];

        for (const sample of samples) {
          await databaseService.addSubscription(sample);
        }
        
        const refreshedData = await databaseService.getSubscriptions(user.uid);
        setSubscriptions(refreshedData);
      } else {
        setSubscriptions(data);
      }
    } catch (err) {
      console.error("Error fetching subscriptions:", err);
    }
  };

  const handleEditBudgetLimit = async (newLimit) => {
    setBudgetLimit(newLimit);
    if (user) {
      try {
        await authService.updateUserProfile(user.uid, { budgetLimit: newLimit });
      } catch (err) {
        console.error("Error saving budget limit:", err);
      }
    }
  };

  const handleSaveSubscription = async (data) => {
    setActionLoading(true);
    try {
      if (data.id) {
        // Update action
        const { id, ...rest } = data;
        await databaseService.updateSubscription(id, rest);
      } else {
        // Add action
        await databaseService.addSubscription({ ...data, userId: user.uid });
      }
      await fetchSubs();
    } catch (err) {
      console.error("Error saving subscription:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSubscription = async (id) => {
    setActionLoading(true);
    try {
      await databaseService.deleteSubscription(id);
      await fetchSubs();
    } catch (err) {
      console.error("Error deleting subscription:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSelect = (sub) => {
    setEditingSubscription(sub);
    setIsModalOpen(true);
  };

  const handleAddNewClick = () => {
    setEditingSubscription(null);
    setIsModalOpen(true);
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
    } catch (err) {
      console.error("Error logging out:", err);
    }
  };

  // Filter and Sort helper logic
  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (sub.domain && sub.domain.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || sub.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
    // date-soon sorting
    if (sortBy === 'date-soon') {
      const today = new Date('2026-07-01');
      const getDaysLeft = (s) => {
        const start = new Date(s.firstBillDate);
        let next = new Date(start);
        while (next < today) {
          if (s.billingCycle === 'weekly') next.setDate(next.getDate() + 7);
          else if (s.billingCycle === 'yearly') next.setFullYear(next.getFullYear() + 1);
          else next.setMonth(next.getMonth() + 1);
        }
        return next - today;
      };
      return getDaysLeft(a) - getDaysLeft(b);
    }
    return 0;
  });

  if (authLoading) {
    return (
      <div style={styles.loadingContainer}>
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          style={styles.spinner}
        />
        <span style={styles.loadingText}>Configuring SubSpace...</span>
      </div>
    );
  }

  // Not logged in, render authentication page
  if (!user) {
    return <Auth onAuthSuccess={fetchSubs} />;
  }

  return (
    <div style={styles.appWrapper}>
      {/* Top Bar Navigation */}
      <nav style={styles.topNav}>
        <div style={styles.brandingGroup}>
          <div style={styles.brandBadge}>
            <Sparkles size={16} color="#8b5cf6" />
          </div>
          <span style={styles.appTitle}>SubSpace</span>
        </div>
        
        <div style={styles.userControls}>
          <div style={styles.userProfile}>
            <div style={styles.userAvatar}>
              {user.email.charAt(0).toUpperCase()}
            </div>
            <span style={styles.userEmail}>{user.isAnonymous ? 'Guest' : user.displayName || user.email}</span>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn} title="Sign Out">
            <LogOut size={16} color="#cbd5e1" />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div style={styles.mainContent}>
        <AnimatePresence mode="wait">
          {activeTab === 'overview' ? (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.25 }}
              style={styles.viewContainer}
            >
              <Dashboard 
                subscriptions={subscriptions} 
                onAddClick={handleAddNewClick}
                onSelectSubscription={handleEditSelect}
                userCurrency={userCurrency}
                budgetLimit={budgetLimit}
                onEditBudgetLimit={handleEditBudgetLimit}
              />
            </motion.div>
          ) : (
            <motion.div 
              key="list"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.25 }}
              style={styles.viewContainer}
            >
              {/* Detailed subscription list view */}
              <div style={styles.listViewWrapper} className="no-scrollbar">
                
                {/* Search and Filters Header */}
                <div style={styles.listFilterHeader}>
                  <h2 style={styles.listTitle}>All Subscriptions</h2>
                  <p style={styles.listSubtitle}>{subscriptions.length} active entries</p>
                </div>

                {/* Search Bar Input */}
                <div style={styles.searchContainer}>
                  <Search size={18} style={styles.searchIcon} />
                  <input 
                    type="text" 
                    placeholder="Search by name or website..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={styles.searchInput}
                  />
                </div>

                {/* Filter and Sort Controllers */}
                <div style={styles.filterControllers}>
                  {/* Category Chips Scroll */}
                  <div style={styles.categoryChips} className="no-scrollbar">
                    <button 
                      onClick={() => setSelectedCategory('all')}
                      style={{
                        ...styles.chip,
                        background: selectedCategory === 'all' ? 'var(--primary)' : 'rgba(255,255,255,0.04)',
                        color: selectedCategory === 'all' ? '#fff' : 'var(--text-secondary)',
                        border: selectedCategory === 'all' ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                      }}
                    >
                      All
                    </button>
                    {CATEGORIES.map(cat => (
                      <button 
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        style={{
                          ...styles.chip,
                          background: selectedCategory === cat.id ? cat.color : 'rgba(255,255,255,0.04)',
                          color: selectedCategory === cat.id ? '#fff' : 'var(--text-secondary)',
                          border: selectedCategory === cat.id ? `1px solid ${cat.color}` : '1px solid var(--border-color)',
                        }}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Sorter Selector */}
                  <div style={styles.sorterRow}>
                    <SlidersHorizontal size={14} color="#64748b" />
                    <span style={styles.sortLabel}>Sort:</span>
                    <select 
                      value={sortBy} 
                      onChange={(e) => setSortBy(e.target.value)}
                      style={styles.sortSelect}
                    >
                      <option value="price-desc">Highest Price</option>
                      <option value="price-asc">Lowest Price</option>
                      <option value="date-soon">Renewal Date</option>
                      <option value="name-asc">Alphabetical</option>
                    </select>
                  </div>
                </div>

                {/* Cards List Container */}
                <div style={styles.cardsList}>
                  <AnimatePresence>
                    {filteredSubscriptions.map(sub => (
                      <motion.div
                        key={sub.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        layout
                      >
                        <SubscriptionCard 
                          subscription={sub}
                          onDelete={handleDeleteSubscription}
                          onClick={handleEditSelect}
                          currencySymbol={getCurrencySymbol(userCurrency)}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {filteredSubscriptions.length === 0 && (
                    <div style={styles.emptySearch}>
                      <FolderMinus size={36} color="#475569" style={{ marginBottom: 12 }} />
                      <h3>No subscriptions found</h3>
                      <p>Try refining your search terms or filter selection</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Add Button for Mobile Quick Access */}
      {activeTab === 'list' && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleAddNewClick}
          style={styles.floatingAddBtn}
        >
          <Plus size={24} color="#fff" />
        </motion.button>
      )}

      {/* Bottom Tab Navigation Bar */}
      <nav style={styles.bottomNav} className="glass">
        <button 
          onClick={() => setActiveTab('overview')} 
          style={{
            ...styles.navItem,
            color: activeTab === 'overview' ? 'var(--primary)' : 'var(--text-secondary)'
          }}
        >
          <LayoutDashboard size={20} style={{ marginBottom: 4 }} />
          <span>Overview</span>
          {activeTab === 'overview' && (
            <motion.div layoutId="navIndicator" style={styles.navIndicator} />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('list')} 
          style={{
            ...styles.navItem,
            color: activeTab === 'list' ? 'var(--primary)' : 'var(--text-secondary)'
          }}
        >
          <CreditCard size={20} style={{ marginBottom: 4 }} />
          <span>Subscriptions</span>
          {activeTab === 'list' && (
            <motion.div layoutId="navIndicator" style={styles.navIndicator} />
          )}
        </button>
      </nav>

      {/* Bottom Sheet Sheet Drawer Modal */}
      <SubscriptionModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingSubscription(null); }}
        onSave={handleSaveSubscription}
        editingSubscription={editingSubscription}
        defaultCurrency={userCurrency}
      />

      {/* Global Syncing Loader Overlay */}
      <AnimatePresence>
        {actionLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={styles.actionLoaderOverlay}
          >
            <div className="glass" style={styles.actionLoaderCard}>
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                style={styles.actionSpinner}
              />
              <span style={styles.actionLoaderText}>Syncing Database...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const styles = {
  loadingContainer: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#09090b',
    gap: '16px',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid rgba(139, 92, 246, 0.1)',
    borderTop: '3px solid var(--primary)',
    borderRadius: '50%',
  },
  loadingText: {
    color: '#cbd5e1',
    fontSize: '0.9rem',
    fontWeight: '500',
  },
  appWrapper: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    backgroundColor: 'var(--bg-color)',
    position: 'relative',
  },
  topNav: {
    height: 'calc(60px + var(--safe-top))',
    paddingTop: 'var(--safe-top)',
    paddingLeft: '20px',
    paddingRight: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid var(--border-color)',
    zIndex: 10,
    backgroundColor: 'rgba(9, 9, 11, 0.8)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  },
  brandingGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  brandBadge: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    background: 'rgba(139, 92, 246, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appTitle: {
    fontSize: '1.15rem',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #fff 0%, #a78bfa 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  userControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  userAvatar: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    fontWeight: '700',
  },
  userEmail: {
    fontSize: '0.85rem',
    color: '#cbd5e1',
    fontWeight: '500',
    maxWidth: '120px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  logoutBtn: {
    background: 'transparent',
    border: 'none',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ':hover': {
      background: 'rgba(255, 255, 255, 0.05)',
    }
  },
  mainContent: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  viewContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  listViewWrapper: {
    flex: 1,
    padding: '24px 20px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    paddingBottom: '32px',
  },
  listFilterHeader: {
    marginTop: '4px',
  },
  listTitle: {
    fontSize: '1.5rem',
    fontWeight: '800',
    color: '#f8fafc',
  },
  listSubtitle: {
    fontSize: '0.85rem',
    color: '#64748b',
    marginTop: '2px',
  },
  searchContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    color: '#64748b',
  },
  searchInput: {
    paddingLeft: '42px',
  },
  filterControllers: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  categoryChips: {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    paddingBottom: '4px',
  },
  chip: {
    padding: '6px 14px',
    fontSize: '0.8rem',
    borderRadius: '20px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  sorterRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  sortLabel: {
    fontSize: '0.8rem',
    color: '#64748b',
    fontWeight: '500',
  },
  sortSelect: {
    width: 'auto',
    padding: '6px 32px 6px 12px',
    fontSize: '0.8rem',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border-color)',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    backgroundSize: '12px',
  },
  cardsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px', // gap handled inside swipe container margins
    marginTop: '8px',
  },
  emptySearch: {
    textAlign: 'center',
    padding: '48px 24px',
    color: '#64748b',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingAddBtn: {
    position: 'absolute',
    bottom: 'calc(80px + var(--safe-bottom))',
    right: '24px',
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4)',
    zIndex: 900,
  },
  bottomNav: {
    height: 'calc(55px + var(--safe-bottom))',
    borderTop: '1px solid var(--border-color)',
    paddingBottom: 'var(--safe-bottom)',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 950,
  },
  navItem: {
    flex: 1,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.725rem',
    fontWeight: '600',
    background: 'transparent',
    position: 'relative',
  },
  navIndicator: {
    position: 'absolute',
    top: 0,
    width: '40px',
    height: '3px',
    background: 'var(--primary)',
    borderRadius: '0 0 4px 4px',
  },
  actionLoaderOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1100,
  },
  actionLoaderCard: {
    padding: '24px 32px',
    borderRadius: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    background: 'rgba(18, 18, 20, 0.8)',
  },
  actionSpinner: {
    width: '28px',
    height: '28px',
    border: '3px solid rgba(139, 92, 246, 0.15)',
    borderTop: '3px solid var(--primary)',
    borderRadius: '50%',
  },
  actionLoaderText: {
    fontSize: '0.85rem',
    color: '#cbd5e1',
    fontWeight: '600',
    letterSpacing: '0.5px',
  }
};
