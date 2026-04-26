import crypto from 'crypto';

export type AlertType = 'above' | 'below';
export type AlertStatus = 'active' | 'triggered' | 'inactive';

export interface PriceAlert {
  id: string;
  currency: string;
  targetPrice: number;
  alertType: AlertType;
  status: AlertStatus;
  createdAt: number;
  triggeredAt?: number;
  notificationSent: boolean;
}

export class PriceAlertStorage {
  private static readonly STORAGE_KEY = 'stellar_spend_price_alerts';
  private static readonly POLL_INTERVAL = 60000; // 1 minute
  private static pollingInterval: NodeJS.Timeout | null = null;

  static createAlert(alert: Omit<PriceAlert, 'id' | 'createdAt' | 'triggeredAt' | 'notificationSent'>): PriceAlert {
    const id = crypto.randomUUID();
    const saved: PriceAlert = {
      ...alert,
      id,
      createdAt: Date.now(),
      notificationSent: false,
    };

    const alerts = this.getAllAlerts();
    alerts.push(saved);
    this.persistAlerts(alerts);
    return saved;
  }

  static getAlert(id: string): PriceAlert | null {
    const alerts = this.getAllAlerts();
    return alerts.find(a => a.id === id) || null;
  }

  static getAllAlerts(): PriceAlert[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  static getActiveAlerts(): PriceAlert[] {
    return this.getAllAlerts().filter(a => a.status === 'active');
  }

  static deleteAlert(id: string): boolean {
    const alerts = this.getAllAlerts();
    const filtered = alerts.filter(a => a.id !== id);
    if (filtered.length === alerts.length) return false;
    this.persistAlerts(filtered);
    return true;
  }

  static updateAlert(id: string, updates: Partial<Omit<PriceAlert, 'id' | 'createdAt'>>): PriceAlert | null {
    const alerts = this.getAllAlerts();
    const index = alerts.findIndex(a => a.id === id);
    if (index === -1) return null;

    alerts[index] = { ...alerts[index], ...updates };
    this.persistAlerts(alerts);
    return alerts[index];
  }

  static checkAlerts(currentPrices: Record<string, number>): PriceAlert[] {
    const alerts = this.getActiveAlerts();
    const triggered: PriceAlert[] = [];

    alerts.forEach(alert => {
      const currentPrice = currentPrices[alert.currency];
      if (!currentPrice) return;

      const shouldTrigger = 
        (alert.alertType === 'above' && currentPrice >= alert.targetPrice) ||
        (alert.alertType === 'below' && currentPrice <= alert.targetPrice);

      if (shouldTrigger && !alert.notificationSent) {
        this.updateAlert(alert.id, {
          status: 'triggered',
          triggeredAt: Date.now(),
          notificationSent: true,
        });
        triggered.push(alert);
      }
    });

    return triggered;
  }

  static startMonitoring(onAlert: (alerts: PriceAlert[]) => void, getPrices: () => Promise<Record<string, number>>) {
    if (this.pollingInterval) return;

    this.pollingInterval = setInterval(async () => {
      try {
        const prices = await getPrices();
        const triggered = this.checkAlerts(prices);
        if (triggered.length > 0) {
          onAlert(triggered);
        }
      } catch (error) {
        console.error('Price alert check failed:', error);
      }
    }, this.POLL_INTERVAL);
  }

  static stopMonitoring() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  private static persistAlerts(alerts: PriceAlert[]): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(alerts));
    }
  }
}
