// Real-time Event System for Instant Cross-Tab & Cross-Component Communication
export type EventType = 'payments' | 'vouchers' | 'announcements';
export const PENDING_VOUCHER_PAYMENT_KEY = 'pendingVoucherPaymentId';

export const notifyDataChanged = (type: EventType) => {
  // 1. Instant local tab event
  window.dispatchEvent(new CustomEvent(`${type}_updated`));

  // 2. Instant cross-tab real-time communication via BroadcastChannel
  try {
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel('wifi_portal_realtime');
      channel.postMessage({ type, timestamp: Date.now() });
      channel.close();
    }
  } catch (e) {
    // Fallback if BroadcastChannel not available
  }
};

export const subscribeToRealtimeEvents = (
  type: EventType,
  callback: () => void
): (() => void) => {
  // Local event listener
  const handleLocalEvent = () => callback();
  window.addEventListener(`${type}_updated`, handleLocalEvent);
  window.addEventListener('storage', handleLocalEvent);

  // BroadcastChannel cross-tab listener
  let channel: BroadcastChannel | null = null;
  if ('BroadcastChannel' in window) {
    try {
      channel = new BroadcastChannel('wifi_portal_realtime');
      channel.onmessage = (event) => {
        if (event.data?.type === type) {
          callback();
        }
      };
    } catch (e) {
      // Fallback
    }
  }

  // Return cleanup function
  return () => {
    window.removeEventListener(`${type}_updated`, handleLocalEvent);
    window.removeEventListener('storage', handleLocalEvent);
    if (channel) {
      channel.close();
    }
  };
};
