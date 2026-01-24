import {
  Customer,
  Kit,
  Offer,
  OfferItem,
  Payment,
  PaymentPreferences,
  KitSummary,
  TimelineEvent,
  KitStatus,
  PaymentMethod,
} from './types';

// Customers
export const customers: Customer[] = [
  {
    id: 'c1',
    name: 'John Doe',
    email: 'john.doe@email.com',
    phone: '(555) 123-4567',
    address: {
      street: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zip: '10001',
    },
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
      zip: '90001',
    },
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
      zip: '60601',
    },
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
      zip: '77001',
    },
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
      zip: '85001',
    },
  },
];

// Kit Requests
export const kits: (Kit & { timeline: TimelineEvent[] })[] = [
  {
    id: 'r101',
    customerId: 'c1',
    kitType: 'digital',
    status: 'pending',
    createdAt: '2025-01-10',
    timeline: [{ event: 'Kit requested', date: '2025-01-10' }],
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
      { event: 'Physical kit mailed', date: '2025-01-09' },
    ],
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
      { event: 'Package received', date: '2025-01-11' },
    ],
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
      { event: 'Evaluation started', date: '2025-01-10' },
    ],
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
      { event: 'Offer sent to customer', date: '2025-01-10' },
    ],
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
      { event: 'Offer accepted', date: '2025-01-07' },
    ],
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
      { event: 'Payment sent', date: '2025-01-05' },
    ],
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
      { event: 'Offer declined', date: '2025-01-02' },
    ],
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
      { event: 'Items returned to customer', date: '2025-01-03' },
    ],
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
      { event: 'Package shipped by customer', date: '2025-01-10' },
    ],
  },
];

// Evaluated Items
export const items: OfferItem[] = [
  // Items for request r098 (evaluating)
  { id: 'i1', name: 'ring', description: '14K Gold wedding band', metalType: '14K', weight: 5.2, purity: '14K', value: 192.40 },
  { id: 'i2', name: 'necklace', description: '18K Gold chain necklace', metalType: '18K', weight: 12.1, purity: '18K', value: 574.75 },
  // Items for request r097 (offer_sent)
  { id: 'i3', name: 'bracelet', description: 'Sterling silver tennis bracelet', metalType: 'sterling', weight: 22.5, purity: 'sterling', value: 19.13 },
  { id: 'i4', name: 'earrings', description: '14K Gold hoop earrings', metalType: '14K', weight: 3.8, purity: '14K', value: 140.60 },
  { id: 'i5', name: 'ring', description: '10K Gold class ring', metalType: '10K', weight: 8.5, purity: '10K', value: 225.25 },
  // Items for request r096 (accepted)
  { id: 'i6', name: 'coins', description: '1oz Gold American Eagle coins (2)', metalType: '22K', weight: 62.2, purity: '22K', value: 3607.60 },
  // Items for request r095 (paid)
  { id: 'i7', name: 'necklace', description: '24K Gold pendant necklace', metalType: '24K', weight: 15.3, purity: '24K', value: 963.90 },
  { id: 'i8', name: 'bracelet', description: '18K Gold link bracelet', metalType: '18K', weight: 18.7, purity: '18K', value: 888.25 },
  // Items for request r094 (declined)
  { id: 'i9', name: 'watch', description: 'Gold plated watch (minimal gold content)', metalType: '10K', weight: 45.0, purity: '10K', value: 85.00 },
];

// Map items to requests
const itemRequestMap: Record<string, string[]> = {
  r098: ['i1', 'i2'],
  r097: ['i3', 'i4', 'i5'],
  r096: ['i6'],
  r095: ['i7', 'i8'],
  r094: ['i9'],
};

// Offers
export const offers: Offer[] = [
  {
    id: 'o1',
    kitId: 'r097',
    items: items.filter(i => itemRequestMap['r097']?.includes(i.id)),
    totalValue: 384.98,
    createdAt: '2025-01-10',
    expiresAt: '2025-01-17',
    status: 'pending',
  },
  {
    id: 'o2',
    kitId: 'r096',
    items: items.filter(i => itemRequestMap['r096']?.includes(i.id)),
    totalValue: 3607.60,
    createdAt: '2025-01-06',
    status: 'accepted',
    acceptedAt: '2025-01-07',
    paymentMethod: 'paypal',
  },
  {
    id: 'o3',
    kitId: 'r095',
    items: items.filter(i => itemRequestMap['r095']?.includes(i.id)),
    totalValue: 1852.15,
    createdAt: '2025-01-03',
    status: 'accepted',
    acceptedAt: '2025-01-04',
    paymentMethod: 'check',
  },
  {
    id: 'o4',
    kitId: 'r094',
    items: items.filter(i => itemRequestMap['r094']?.includes(i.id)),
    totalValue: 85.00,
    createdAt: '2024-12-31',
    status: 'declined',
    declinedAt: '2025-01-02',
  },
  {
    id: 'o5',
    kitId: 'r093',
    items: [],
    totalValue: 245.50,
    createdAt: '2024-12-27',
    status: 'declined',
    declinedAt: '2024-12-29',
  },
];

// Payments
export const payments: Payment[] = [
  {
    id: 'p1',
    offerId: 'o2',
    amount: 3607.60,
    method: 'paypal',
    status: 'pending',
    createdAt: '2025-01-07',
  },
  {
    id: 'p2',
    offerId: 'o3',
    amount: 1852.15,
    method: 'check',
    status: 'completed',
    createdAt: '2025-01-04',
    completedAt: '2025-01-05',
  },
];

// User payment preferences
export const userPaymentPreferences: Record<string, PaymentPreferences> = {
  c1: { defaultMethod: 'paypal', paypalEmail: 'john.doe@email.com' },
  c2: { defaultMethod: 'check' },
  c3: { defaultMethod: 'zelle', zellePhone: '(555) 345-6789' },
  c4: { defaultMethod: 'bank_transfer', bankAccount: '****1234' },
  c5: { defaultMethod: 'check' },
};

// Gold Geek shipping address
export const GOLDGEEK_ADDRESS = {
  name: 'Gold Geek',
  street: '1234 Gold Avenue',
  city: 'Dallas',
  state: 'TX',
  zip: '75201',
};

// Helper functions
export function getCustomerById(customerId: string): Customer | undefined {
  return customers.find(c => c.id === customerId);
}

export function getCustomerByEmail(email: string): Customer | undefined {
  return customers.find(c => c.email.toLowerCase() === email.toLowerCase());
}

export function getKitById(kitId: string): (Kit & { timeline: TimelineEvent[] }) | undefined {
  return kits.find(k => k.id === kitId);
}

export function getKitsByCustomerId(customerId: string): (Kit & { timeline: TimelineEvent[] })[] {
  return kits.filter(k => k.customerId === customerId);
}

export function getOfferByKitId(kitId: string): Offer | undefined {
  return offers.find(o => o.kitId === kitId);
}

export function getItemsByKitId(kitId: string): OfferItem[] {
  const itemIds = itemRequestMap[kitId] || [];
  return items.filter(i => itemIds.includes(i.id));
}

export function getPaymentPreferences(customerId: string): PaymentPreferences {
  return userPaymentPreferences[customerId] || { defaultMethod: 'check' };
}

export function getKitSummary(kitId: string): KitSummary | null {
  const kit = getKitById(kitId);
  if (!kit) return null;

  const kitItems = getItemsByKitId(kitId);
  const offer = getOfferByKitId(kitId);

  return {
    id: kit.id,
    status: kit.status,
    kitType: kit.kitType,
    itemCount: kitItems.length || (offer?.items.length ?? 0),
    trackingNumber: kit.trackingNumber,
    offer: offer ? {
      totalValue: offer.totalValue,
      expiresAt: offer.expiresAt,
    } : undefined,
    timeline: kit.timeline,
  };
}

export function getActiveKits(customerId: string): (Kit & { timeline: TimelineEvent[] })[] {
  const completedStatuses: KitStatus[] = ['paid', 'returned'];
  return getKitsByCustomerId(customerId).filter(k => !completedStatuses.includes(k.status));
}

export function getCompletedKits(customerId: string): (Kit & { timeline: TimelineEvent[] })[] {
  const completedStatuses: KitStatus[] = ['paid', 'returned'];
  return getKitsByCustomerId(customerId).filter(k => completedStatuses.includes(k.status));
}

export function needsShippingLabel(kit: Kit): boolean {
  const earlyStatuses: KitStatus[] = ['pending', 'kit_sent'];
  return kit.kitType === 'digital' && earlyStatuses.includes(kit.status);
}

export function hasPendingOffer(kit: Kit): boolean {
  return kit.status === 'offer_sent';
}

// Simulate accepting an offer (for demo purposes)
export function simulateAcceptOffer(kitId: string, paymentMethod: PaymentMethod): boolean {
  const kit = kits.find(k => k.id === kitId);
  const offer = offers.find(o => o.kitId === kitId);

  if (kit && offer) {
    kit.status = 'accepted';
    offer.status = 'accepted';
    offer.acceptedAt = new Date().toISOString().split('T')[0];
    offer.paymentMethod = paymentMethod;
    kit.timeline.unshift({
      event: 'Offer accepted',
      date: offer.acceptedAt,
    });
    return true;
  }
  return false;
}

// Simulate declining an offer (for demo purposes)
export function simulateDeclineOffer(kitId: string): boolean {
  const kit = kits.find(k => k.id === kitId);
  const offer = offers.find(o => o.kitId === kitId);

  if (kit && offer) {
    kit.status = 'declined';
    offer.status = 'declined';
    offer.declinedAt = new Date().toISOString().split('T')[0];
    kit.timeline.unshift({
      event: 'Offer declined - return requested',
      date: offer.declinedAt,
    });
    return true;
  }
  return false;
}
