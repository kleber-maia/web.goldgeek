// Gold Geek User Dashboard - Mock Data Extensions

// Get requests for a specific user (filters by customerId)
function getUserKits(userId) {
  return requests.filter(r => r.customerId === userId);
}

// Get kit summary WITHOUT exposing weights (business requirement)
function getKitSummaryForUser(requestId) {
  const request = getRequestById(requestId);
  if (!request) return null;

  const items = getItemsByRequestId(requestId);
  const offer = getOfferByRequestId(requestId);

  return {
    id: request.id,
    kitType: request.kitType,
    status: request.status,
    trackingNumber: request.trackingNumber,
    timeline: request.timeline,
    createdAt: request.createdAt,
    itemCount: items.length,
    offer: offer ? {
      id: offer.id,
      totalValue: offer.totalValue,
      status: offer.status,
      sentAt: offer.sentAt,
      expiresAt: offer.expiresAt
    } : null
  };
}

// User payment preferences (prototype mock)
const userPaymentPreferences = {
  c1: { defaultMethod: 'paypal', paypalEmail: 'john.doe@email.com' },
  c2: { defaultMethod: 'check' },
  c3: { defaultMethod: 'zelle', zellePhone: '(555) 345-6789' },
  c4: { defaultMethod: 'bank_transfer', bankAccount: '****1234' },
  c5: { defaultMethod: 'check' }
};

function getUserPaymentPreferences(userId) {
  return userPaymentPreferences[userId] || { defaultMethod: 'check' };
}

// Simulate accepting an offer
function simulateAcceptOffer(requestId, paymentMethod) {
  const request = requests.find(r => r.id === requestId);
  const offer = offers.find(o => o.requestId === requestId);

  if (request && offer) {
    request.status = 'accepted';
    offer.status = 'accepted';
    offer.respondedAt = new Date().toISOString().split('T')[0];
    request.timeline.unshift({
      event: 'Offer accepted',
      date: offer.respondedAt
    });

    payments.push({
      id: 'p' + (payments.length + 1),
      offerId: offer.id,
      requestId: requestId,
      amount: offer.totalValue,
      method: paymentMethod,
      status: 'pending',
      processedAt: null
    });

    return true;
  }
  return false;
}

// Simulate declining an offer
function simulateDeclineOffer(requestId) {
  const request = requests.find(r => r.id === requestId);
  const offer = offers.find(o => o.requestId === requestId);

  if (request && offer) {
    request.status = 'declined';
    offer.status = 'declined';
    offer.respondedAt = new Date().toISOString().split('T')[0];
    request.timeline.unshift({
      event: 'Offer declined - return requested',
      date: offer.respondedAt
    });

    returns.push({
      id: 'ret' + (returns.length + 1),
      requestId: requestId,
      status: 'pending',
      trackingNumber: null,
      createdAt: offer.respondedAt
    });

    return true;
  }
  return false;
}

// Format status for user-friendly display
function formatStatusForUser(status) {
  const statusMap = {
    'pending': 'Processing Request',
    'kit_sent': 'Kit On Its Way',
    'in_transit': 'Package In Transit',
    'received': 'Package Received',
    'evaluating': 'Being Evaluated',
    'offer_sent': 'Offer Ready',
    'accepted': 'Offer Accepted',
    'declined': 'Offer Declined',
    'paid': 'Payment Complete',
    'returned': 'Items Returned'
  };
  return statusMap[status] || status;
}

// Check if kit needs shipping label (digital kit in early status)
function needsShippingLabel(request) {
  const earlyStatuses = ['pending', 'kit_sent'];
  return request.kitType === 'digital' && earlyStatuses.includes(request.status);
}

// Check if kit has pending offer
function hasPendingOffer(request) {
  return request.status === 'offer_sent';
}

// Get active kits (not completed)
function getActiveKits(userId) {
  const completedStatuses = ['paid', 'returned'];
  return getUserKits(userId).filter(r => !completedStatuses.includes(r.status));
}

// Get completed kits
function getCompletedKits(userId) {
  const completedStatuses = ['paid', 'returned'];
  return getUserKits(userId).filter(r => completedStatuses.includes(r.status));
}

// Generate mock FedEx tracking number
function generateMockTrackingNumber() {
  const prefix = '7489';
  const random = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
  return prefix + random;
}

// Gold Geek shipping address
const GOLDGEEK_ADDRESS = {
  name: 'Gold Geek',
  street: '1234 Gold Avenue',
  city: 'Dallas',
  state: 'TX',
  zip: '75201'
};
