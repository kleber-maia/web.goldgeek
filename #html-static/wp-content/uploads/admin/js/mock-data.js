// Gold Geek Admin - Mock Data

const KIT_TYPES = ['digital', 'physical'];

const STATUSES = {
  pending: { label: 'Pending', badgeClass: 'pending' },
  kit_sent: { label: 'Kit Sent', badgeClass: 'purple' },
  in_transit: { label: 'In Transit', badgeClass: 'in-progress' },
  received: { label: 'Received', badgeClass: 'in-progress' },
  evaluating: { label: 'Evaluating', badgeClass: 'in-progress' },
  offer_sent: { label: 'Offer Sent', badgeClass: 'pending' },
  accepted: { label: 'Accepted', badgeClass: 'success' },
  declined: { label: 'Declined', badgeClass: 'error' },
  paid: { label: 'Paid', badgeClass: 'success' },
  returned: { label: 'Returned', badgeClass: 'gray' }
};

const ITEM_TYPES = [
  { value: 'ring', label: 'Ring' },
  { value: 'necklace', label: 'Necklace' },
  { value: 'bracelet', label: 'Bracelet' },
  { value: 'earrings', label: 'Earrings' },
  { value: 'watch', label: 'Watch' },
  { value: 'coins', label: 'Coins' },
  { value: 'bars', label: 'Bars/Ingots' },
  { value: 'other', label: 'Other' }
];

const PURITY_OPTIONS = [
  { value: '10K', label: '10K Gold', pricePerGram: 26.50 },
  { value: '14K', label: '14K Gold', pricePerGram: 37.00 },
  { value: '18K', label: '18K Gold', pricePerGram: 47.50 },
  { value: '22K', label: '22K Gold', pricePerGram: 58.00 },
  { value: '24K', label: '24K Gold', pricePerGram: 63.00 },
  { value: 'sterling', label: 'Sterling Silver (.925)', pricePerGram: 0.85 },
  { value: 'platinum', label: 'Platinum', pricePerGram: 32.00 }
];

const PAYMENT_METHODS = [
  { value: 'check', label: 'Check' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'zelle', label: 'Zelle' },
  { value: 'bank_transfer', label: 'Bank Transfer' }
];

// Customers
const customers = [
  {
    id: 'c1',
    name: 'John Doe',
    email: 'john.doe@email.com',
    phone: '(555) 123-4567',
    address: {
      street: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zip: '10001'
    },
    createdAt: '2024-12-15'
  },
  {
    id: 'c2',
    name: 'Jane Smith',
    email: 'jane.smith@email.com',
    phone: '(555) 234-5678',
    address: {
      street: '456 Oak Avenue',
      city: 'Los Angeles',
      state: 'CA',
      zip: '90001'
    },
    createdAt: '2024-12-20'
  },
  {
    id: 'c3',
    name: 'Bob Wilson',
    email: 'bob.wilson@email.com',
    phone: '(555) 345-6789',
    address: {
      street: '789 Pine Road',
      city: 'Chicago',
      state: 'IL',
      zip: '60601'
    },
    createdAt: '2025-01-02'
  },
  {
    id: 'c4',
    name: 'Mary Johnson',
    email: 'mary.j@email.com',
    phone: '(555) 456-7890',
    address: {
      street: '321 Elm Street',
      city: 'Houston',
      state: 'TX',
      zip: '77001'
    },
    createdAt: '2025-01-05'
  },
  {
    id: 'c5',
    name: 'David Brown',
    email: 'david.brown@email.com',
    phone: '(555) 567-8901',
    address: {
      street: '654 Maple Drive',
      city: 'Phoenix',
      state: 'AZ',
      zip: '85001'
    },
    createdAt: '2025-01-08'
  }
];

// Kit Requests
const requests = [
  {
    id: 'r101',
    customerId: 'c1',
    kitType: 'digital',
    status: 'pending',
    createdAt: '2025-01-10',
    trackingNumber: null,
    timeline: [
      { event: 'Kit requested', date: '2025-01-10' }
    ]
  },
  {
    id: 'r100',
    customerId: 'c2',
    kitType: 'physical',
    status: 'kit_sent',
    createdAt: '2025-01-09',
    trackingNumber: 'USPS1234567890',
    timeline: [
      { event: 'Kit requested', date: '2025-01-09' },
      { event: 'Physical kit mailed', date: '2025-01-09' }
    ]
  },
  {
    id: 'r099',
    customerId: 'c3',
    kitType: 'digital',
    status: 'received',
    createdAt: '2025-01-08',
    trackingNumber: 'USPS9876543210',
    timeline: [
      { event: 'Kit requested', date: '2025-01-08' },
      { event: 'Digital kit sent', date: '2025-01-08' },
      { event: 'Package shipped by customer', date: '2025-01-09' },
      { event: 'Package received', date: '2025-01-11' }
    ]
  },
  {
    id: 'r098',
    customerId: 'c4',
    kitType: 'digital',
    status: 'evaluating',
    createdAt: '2025-01-07',
    trackingNumber: 'USPS1111222233',
    timeline: [
      { event: 'Kit requested', date: '2025-01-07' },
      { event: 'Digital kit sent', date: '2025-01-07' },
      { event: 'Package shipped by customer', date: '2025-01-08' },
      { event: 'Package received', date: '2025-01-10' },
      { event: 'Evaluation started', date: '2025-01-10' }
    ]
  },
  {
    id: 'r097',
    customerId: 'c5',
    kitType: 'physical',
    status: 'offer_sent',
    createdAt: '2025-01-05',
    trackingNumber: 'USPS4444555566',
    timeline: [
      { event: 'Kit requested', date: '2025-01-05' },
      { event: 'Physical kit mailed', date: '2025-01-05' },
      { event: 'Kit received by customer', date: '2025-01-07' },
      { event: 'Package shipped by customer', date: '2025-01-08' },
      { event: 'Package received', date: '2025-01-09' },
      { event: 'Evaluation completed', date: '2025-01-10' },
      { event: 'Offer sent to customer', date: '2025-01-10' }
    ]
  },
  {
    id: 'r096',
    customerId: 'c1',
    kitType: 'digital',
    status: 'accepted',
    createdAt: '2025-01-02',
    trackingNumber: 'USPS7777888899',
    timeline: [
      { event: 'Kit requested', date: '2025-01-02' },
      { event: 'Digital kit sent', date: '2025-01-02' },
      { event: 'Package shipped by customer', date: '2025-01-03' },
      { event: 'Package received', date: '2025-01-05' },
      { event: 'Evaluation completed', date: '2025-01-06' },
      { event: 'Offer sent to customer', date: '2025-01-06' },
      { event: 'Offer accepted', date: '2025-01-07' }
    ]
  },
  {
    id: 'r095',
    customerId: 'c2',
    kitType: 'physical',
    status: 'paid',
    createdAt: '2024-12-28',
    trackingNumber: 'USPS0000111122',
    timeline: [
      { event: 'Kit requested', date: '2024-12-28' },
      { event: 'Physical kit mailed', date: '2024-12-28' },
      { event: 'Package received', date: '2025-01-02' },
      { event: 'Evaluation completed', date: '2025-01-03' },
      { event: 'Offer sent', date: '2025-01-03' },
      { event: 'Offer accepted', date: '2025-01-04' },
      { event: 'Payment sent', date: '2025-01-05' }
    ]
  },
  {
    id: 'r094',
    customerId: 'c3',
    kitType: 'digital',
    status: 'declined',
    createdAt: '2024-12-25',
    trackingNumber: 'USPS3333444455',
    timeline: [
      { event: 'Kit requested', date: '2024-12-25' },
      { event: 'Digital kit sent', date: '2024-12-25' },
      { event: 'Package received', date: '2024-12-30' },
      { event: 'Evaluation completed', date: '2024-12-31' },
      { event: 'Offer sent', date: '2024-12-31' },
      { event: 'Offer declined', date: '2025-01-02' }
    ]
  },
  {
    id: 'r093',
    customerId: 'c4',
    kitType: 'physical',
    status: 'returned',
    createdAt: '2024-12-20',
    trackingNumber: 'USPS6666777788',
    timeline: [
      { event: 'Kit requested', date: '2024-12-20' },
      { event: 'Physical kit mailed', date: '2024-12-20' },
      { event: 'Package received', date: '2024-12-26' },
      { event: 'Evaluation completed', date: '2024-12-27' },
      { event: 'Offer sent', date: '2024-12-27' },
      { event: 'Offer declined', date: '2024-12-29' },
      { event: 'Items returned to customer', date: '2025-01-03' }
    ]
  },
  {
    id: 'r092',
    customerId: 'c5',
    kitType: 'digital',
    status: 'in_transit',
    createdAt: '2025-01-09',
    trackingNumber: 'USPS2222333344',
    timeline: [
      { event: 'Kit requested', date: '2025-01-09' },
      { event: 'Digital kit sent', date: '2025-01-09' },
      { event: 'Package shipped by customer', date: '2025-01-10' }
    ]
  }
];

// Evaluated Items
const items = [
  // Items for request r098 (evaluating)
  {
    id: 'i1',
    requestId: 'r098',
    type: 'ring',
    description: '14K Gold wedding band',
    weight: 5.2,
    purity: '14K',
    estimatedValue: 192.40,
    photos: []
  },
  {
    id: 'i2',
    requestId: 'r098',
    type: 'necklace',
    description: '18K Gold chain necklace',
    weight: 12.1,
    purity: '18K',
    estimatedValue: 574.75,
    photos: []
  },
  // Items for request r097 (offer_sent)
  {
    id: 'i3',
    requestId: 'r097',
    type: 'bracelet',
    description: 'Sterling silver tennis bracelet',
    weight: 22.5,
    purity: 'sterling',
    estimatedValue: 19.13,
    photos: []
  },
  {
    id: 'i4',
    requestId: 'r097',
    type: 'earrings',
    description: '14K Gold hoop earrings',
    weight: 3.8,
    purity: '14K',
    estimatedValue: 140.60,
    photos: []
  },
  {
    id: 'i5',
    requestId: 'r097',
    type: 'ring',
    description: '10K Gold class ring',
    weight: 8.5,
    purity: '10K',
    estimatedValue: 225.25,
    photos: []
  },
  // Items for request r096 (accepted)
  {
    id: 'i6',
    requestId: 'r096',
    type: 'coins',
    description: '1oz Gold American Eagle coins (2)',
    weight: 62.2,
    purity: '22K',
    estimatedValue: 3607.60,
    photos: []
  },
  // Items for request r095 (paid)
  {
    id: 'i7',
    requestId: 'r095',
    type: 'necklace',
    description: '24K Gold pendant necklace',
    weight: 15.3,
    purity: '24K',
    estimatedValue: 963.90,
    photos: []
  },
  {
    id: 'i8',
    requestId: 'r095',
    type: 'bracelet',
    description: '18K Gold link bracelet',
    weight: 18.7,
    purity: '18K',
    estimatedValue: 888.25,
    photos: []
  },
  // Items for request r094 (declined)
  {
    id: 'i9',
    requestId: 'r094',
    type: 'watch',
    description: 'Gold plated watch (minimal gold content)',
    weight: 45.0,
    purity: '10K',
    estimatedValue: 85.00,
    photos: []
  }
];

// Offers
const offers = [
  {
    id: 'o1',
    requestId: 'r097',
    totalValue: 384.98,
    status: 'pending',
    sentAt: '2025-01-10',
    respondedAt: null,
    expiresAt: '2025-01-17'
  },
  {
    id: 'o2',
    requestId: 'r096',
    totalValue: 3607.60,
    status: 'accepted',
    sentAt: '2025-01-06',
    respondedAt: '2025-01-07',
    expiresAt: null
  },
  {
    id: 'o3',
    requestId: 'r095',
    totalValue: 1852.15,
    status: 'accepted',
    sentAt: '2025-01-03',
    respondedAt: '2025-01-04',
    expiresAt: null
  },
  {
    id: 'o4',
    requestId: 'r094',
    totalValue: 85.00,
    status: 'declined',
    sentAt: '2024-12-31',
    respondedAt: '2025-01-02',
    expiresAt: null
  },
  {
    id: 'o5',
    requestId: 'r093',
    totalValue: 245.50,
    status: 'declined',
    sentAt: '2024-12-27',
    respondedAt: '2024-12-29',
    expiresAt: null
  }
];

// Payments
const payments = [
  {
    id: 'p1',
    offerId: 'o2',
    requestId: 'r096',
    amount: 3607.60,
    method: 'paypal',
    status: 'pending',
    processedAt: null
  },
  {
    id: 'p2',
    offerId: 'o3',
    requestId: 'r095',
    amount: 1852.15,
    method: 'check',
    status: 'completed',
    processedAt: '2025-01-05'
  }
];

// Returns
const returns = [
  {
    id: 'ret1',
    requestId: 'r094',
    status: 'pending',
    trackingNumber: null,
    createdAt: '2025-01-02'
  },
  {
    id: 'ret2',
    requestId: 'r093',
    status: 'completed',
    trackingNumber: 'USPS9999000011',
    createdAt: '2024-12-29',
    completedAt: '2025-01-03'
  }
];

// Recent Activity (for dashboard)
const recentActivity = [
  {
    id: 'a1',
    type: 'offer_accepted',
    message: 'John D. accepted offer - $3,607.60',
    timestamp: '2 hours ago'
  },
  {
    id: 'a2',
    type: 'kit_request',
    message: 'New kit request from John Doe (Digital)',
    timestamp: '3 hours ago'
  },
  {
    id: 'a3',
    type: 'package_received',
    message: 'Package received - tracking #USPS1111222233',
    timestamp: '5 hours ago'
  },
  {
    id: 'a4',
    type: 'payment_sent',
    message: 'Payment sent to Jane Smith - $1,852.15',
    timestamp: 'Yesterday'
  },
  {
    id: 'a5',
    type: 'offer_declined',
    message: 'Bob Wilson declined offer - $85.00',
    timestamp: '2 days ago'
  },
  {
    id: 'a6',
    type: 'items_returned',
    message: 'Items returned to Mary Johnson',
    timestamp: '3 days ago'
  }
];

// Dashboard Stats
const dashboardStats = {
  newRequests: 12,
  inTransit: 5,
  pendingOffers: 8,
  monthRevenue: 24580.00
};

// Helper functions
function getCustomerById(customerId) {
  return customers.find(c => c.id === customerId);
}

function getRequestById(requestId) {
  return requests.find(r => r.id === requestId);
}

function getItemsByRequestId(requestId) {
  return items.filter(i => i.requestId === requestId);
}

function getOfferByRequestId(requestId) {
  return offers.find(o => o.requestId === requestId);
}

function getPaymentByOfferId(offerId) {
  return payments.find(p => p.offerId === offerId);
}

function getReturnByRequestId(requestId) {
  return returns.find(r => r.requestId === requestId);
}

function calculateItemValue(weight, purity) {
  const purityOption = PURITY_OPTIONS.find(p => p.value === purity);
  if (!purityOption) return 0;
  return (weight * purityOption.pricePerGram).toFixed(2);
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function formatShortDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}
