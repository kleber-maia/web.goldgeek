export type KitStatusKey =
  | 'pending'
  | 'shipped'
  | 'kit_sent'
  | 'in_transit'
  | 'received'
  | 'evaluating'
  | 'offer_sent'
  | 'accepted'
  | 'declined'
  | 'paid'
  | 'returned'
  | 'cancelled';

export type KitStatus = KitStatusKey | Uppercase<KitStatusKey>;

export type KitTypeKey = 'physical' | 'digital';

export type KitType = KitTypeKey | Uppercase<KitTypeKey>;

export type PaymentMethod = 'CHECK' | 'PAYPAL' | 'ZELLE' | 'ACH' | 'VENMO';

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: Address;
}

export interface Kit {
  id: string;
  customerId: string;
  kitType: KitType;
  status: KitStatus;
  createdAt: string;
  trackingNumber?: string;
  returnTrackingNumber?: string;
}

export interface OfferItem {
  id: string;
  name: string;
  description?: string;
  metalType?: string;
  weight?: number;
  purity?: string;
  value: number;
}

export interface Offer {
  id: string;
  kitId: string;
  items: OfferItem[];
  totalValue: number;
  createdAt: string;
  expiresAt?: string;
  status: 'pending' | 'accepted' | 'declined';
  acceptedAt?: string;
  declinedAt?: string;
  paymentMethod?: PaymentMethod;
}

export interface Payment {
  id: string;
  offerId: string;
  amount: number;
  method: PaymentMethod;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
}

export interface TimelineEvent {
  event: string;
  date: string | Date;
  description?: string;
}

export interface KitSummary {
  id: string;
  status: KitStatus;
  kitType: KitType;
  itemCount: number;
  trackingNumber?: string;
  offer?: {
    totalValue: number;
    expiresAt?: string;
  };
  timeline: TimelineEvent[];
}

export interface UserSession {
  userId: string;
  name: string;
  email: string;
}

export interface PaymentPreferences {
  defaultMethod: PaymentMethod;
  paypalEmail?: string;
  zellePhone?: string;
  bankRouting?: string;
  bankAccount?: string;
}

export interface StatusConfig {
  label: string;
  userLabel: string;
  badgeClass: string;
}

export const STATUSES: Record<KitStatusKey, StatusConfig> = {
  pending: { label: 'Pending', userLabel: 'Waiting to be shipped', badgeClass: 'pending' },
  shipped: { label: 'Shipped', userLabel: 'Shipping', badgeClass: 'in-progress' },
  kit_sent: { label: 'Kit Sent', userLabel: 'Kit On The Way', badgeClass: 'purple' },
  in_transit: { label: 'In Transit', userLabel: 'Shipping to Us', badgeClass: 'in-progress' },
  received: { label: 'Received', userLabel: 'Received', badgeClass: 'in-progress' },
  evaluating: { label: 'Evaluating', userLabel: 'Waiting for appraisal', badgeClass: 'in-progress' },
  offer_sent: { label: 'Offer Sent', userLabel: 'Offer sent', badgeClass: 'pending' },
  accepted: { label: 'Accepted', userLabel: 'Waiting for payment', badgeClass: 'success' },
  declined: { label: 'Declined', userLabel: 'Waiting for return to customer', badgeClass: 'gray' },
  paid: { label: 'Paid', userLabel: 'Paid', badgeClass: 'success' },
  returned: { label: 'Returned', userLabel: 'Returned', badgeClass: 'gray' },
  cancelled: { label: 'Cancelled', userLabel: 'Cancelled', badgeClass: 'gray' },
};
