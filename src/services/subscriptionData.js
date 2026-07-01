export const POPULAR_SUBSCRIPTIONS = [
  { name: 'Netflix', domain: 'netflix.com', category: 'entertainment', defaultPrice: 15.49, color: '#e50914' },
  { name: 'Spotify', domain: 'spotify.com', category: 'music', defaultPrice: 11.99, color: '#1db954' },
  { name: 'Apple Music', domain: 'music.apple.com', category: 'music', defaultPrice: 10.99, color: '#fc3c44' },
  { name: 'iCloud+', domain: 'icloud.com', category: 'utilities', defaultPrice: 2.99, color: '#007aff' },
  { name: 'YouTube Premium', domain: 'youtube.com', category: 'entertainment', defaultPrice: 13.99, color: '#ff0000' },
  { name: 'Amazon Prime', domain: 'amazon.com', category: 'entertainment', defaultPrice: 14.99, color: '#ff9900' },
  { name: 'Disney+', domain: 'disneyplus.com', category: 'entertainment', defaultPrice: 7.99, color: '#113ccf' },
  { name: 'Hulu', domain: 'hulu.com', category: 'entertainment', defaultPrice: 7.99, color: '#1ce783' },
  { name: 'HBO Max', domain: 'max.com', category: 'entertainment', defaultPrice: 15.99, color: '#9933ff' },
  { name: 'Adobe Creative Cloud', domain: 'adobe.com', category: 'productivity', defaultPrice: 54.99, color: '#ff0000' },
  { name: 'Figma', domain: 'figma.com', category: 'productivity', defaultPrice: 15.00, color: '#f24e1e' },
  { name: 'Github Copilot', domain: 'github.com', category: 'productivity', defaultPrice: 10.00, color: '#24292e' },
  { name: 'ChatGPT Plus', domain: 'openai.com', category: 'productivity', defaultPrice: 20.00, color: '#10a37f' },
  { name: 'Google One', domain: 'google.com', category: 'utilities', defaultPrice: 1.99, color: '#4285f4' },
  { name: 'Dropbox', domain: 'dropbox.com', category: 'utilities', defaultPrice: 9.99, color: '#0061ff' },
  { name: 'Microsoft 365', domain: 'microsoft.com', category: 'productivity', defaultPrice: 6.99, color: '#f25022' },
  { name: 'PlayStation Network', domain: 'playstation.com', category: 'entertainment', defaultPrice: 9.99, color: '#003087' },
  { name: 'Xbox Game Pass', domain: 'xbox.com', category: 'entertainment', defaultPrice: 16.99, color: '#107c10' },
  { name: 'Nintendo Switch Online', domain: 'nintendo.com', category: 'entertainment', defaultPrice: 3.99, color: '#e60012' },
  { name: 'Duolingo Plus', domain: 'duolingo.com', category: 'productivity', defaultPrice: 6.99, color: '#58cc02' },
  { name: 'Strava', domain: 'strava.com', category: 'health', defaultPrice: 11.99, color: '#fc4c02' },
  { name: 'MyFitnessPal', domain: 'myfitnesspal.com', category: 'health', defaultPrice: 19.99, color: '#0066ee' },
  { name: 'Headspace', domain: 'headspace.com', category: 'health', defaultPrice: 12.99, color: '#ff7a00' },
  { name: 'Calm', domain: 'calm.com', category: 'health', defaultPrice: 14.99, color: '#4c6ef5' },
  { name: 'Slack', domain: 'slack.com', category: 'productivity', defaultPrice: 8.75, color: '#4a154b' },
  { name: 'Notion Plus', domain: 'notion.so', category: 'productivity', defaultPrice: 10.00, color: '#000000' },
  { name: 'Canva Pro', domain: 'canva.com', category: 'productivity', defaultPrice: 14.99, color: '#00c4cc' },
  { name: 'Zoom', domain: 'zoom.us', category: 'productivity', defaultPrice: 14.99, color: '#2d8cff' },
  { name: 'Audible', domain: 'audible.com', category: 'music', defaultPrice: 14.95, color: '#f59a00' },
  { name: 'Medium', domain: 'medium.com', category: 'entertainment', defaultPrice: 5.00, color: '#000000' }
];

export const CATEGORIES = [
  { id: 'entertainment', label: 'Entertainment', color: '#8b5cf6' },
  { id: 'music', label: 'Music & Podcasts', color: '#10b981' },
  { id: 'utilities', label: 'Utilities & Storage', color: '#3b82f6' },
  { id: 'productivity', label: 'Productivity & Work', color: '#ec4899' },
  { id: 'health', label: 'Health & Fitness', color: '#f59e0b' },
  { id: 'other', label: 'Other', color: '#64748b' }
];

export const CURRENCIES = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'INR', symbol: '₹' },
  { code: 'JPY', symbol: '¥' },
  { code: 'CAD', symbol: 'C$' },
  { code: 'AUD', symbol: 'A$' }
];

export const BILLING_CYCLES = [
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' },
  { id: 'weekly', label: 'Weekly' }
];
