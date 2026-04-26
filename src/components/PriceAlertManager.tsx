'use client';

import { useState, useEffect } from 'react';
import { PriceAlertStorage, PriceAlert } from '@/lib/price-alerts';
import { Button } from '@/components/design-system/Button';
import { Card } from '@/components/design-system/Card';

interface PriceAlertManagerProps {
  onAlertTriggered?: (alerts: PriceAlert[]) => void;
}

export function PriceAlertManager({ onAlertTriggered }: PriceAlertManagerProps) {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    currency: 'NGN',
    targetPrice: '',
    alertType: 'above' as const,
  });

  useEffect(() => {
    setAlerts(PriceAlertStorage.getAllAlerts());

    // Start monitoring
    const getPrices = async () => {
      try {
        const res = await fetch('/api/offramp/rate');
        const data = await res.json();
        return { [data.currency]: data.rate };
      } catch {
        return {};
      }
    };

    PriceAlertStorage.startMonitoring((triggered) => {
      setAlerts(PriceAlertStorage.getAllAlerts());
      onAlertTriggered?.(triggered);
    }, getPrices);

    return () => PriceAlertStorage.stopMonitoring();
  }, [onAlertTriggered]);

  const handleCreate = () => {
    if (!formData.targetPrice) return;

    PriceAlertStorage.createAlert({
      currency: formData.currency,
      targetPrice: parseFloat(formData.targetPrice),
      alertType: formData.alertType,
      status: 'active',
    });

    setAlerts(PriceAlertStorage.getAllAlerts());
    setFormData({ currency: 'NGN', targetPrice: '', alertType: 'above' });
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    PriceAlertStorage.deleteAlert(id);
    setAlerts(PriceAlertStorage.getAllAlerts());
  };

  const handleToggle = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    PriceAlertStorage.updateAlert(id, { status: newStatus as any });
    setAlerts(PriceAlertStorage.getAllAlerts());
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Price Alerts</h3>

      {alerts.length > 0 && (
        <div className="space-y-2 mb-4">
          {alerts.map(alert => (
            <div key={alert.id} className="flex justify-between items-center p-2 bg-gray-100 rounded">
              <div className="flex-1">
                <p className="font-medium">
                  {alert.currency} {alert.alertType === 'above' ? '≥' : '≤'} {alert.targetPrice}
                </p>
                <p className="text-sm text-gray-600">
                  Status: <span className={alert.status === 'active' ? 'text-green-600' : 'text-gray-600'}>
                    {alert.status}
                  </span>
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleToggle(alert.id, alert.status)} 
                  variant="secondary" 
                  size="sm"
                >
                  {alert.status === 'active' ? 'Disable' : 'Enable'}
                </Button>
                <button onClick={() => handleDelete(alert.id)} className="text-red-600 hover:text-red-800 px-2">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <div className="space-y-2">
          <select
            value={formData.currency}
            onChange={e => setFormData({ ...formData, currency: e.target.value })}
            className="w-full p-2 border rounded"
          >
            <option value="NGN">NGN</option>
            <option value="KES">KES</option>
            <option value="GHS">GHS</option>
          </select>
          <select
            value={formData.alertType}
            onChange={e => setFormData({ ...formData, alertType: e.target.value as 'above' | 'below' })}
            className="w-full p-2 border rounded"
          >
            <option value="above">Price goes above</option>
            <option value="below">Price goes below</option>
          </select>
          <input
            type="number"
            placeholder="Target Price"
            value={formData.targetPrice}
            onChange={e => setFormData({ ...formData, targetPrice: e.target.value })}
            className="w-full p-2 border rounded"
          />
          <div className="flex gap-2">
            <Button onClick={handleCreate}>Create Alert</Button>
            <Button onClick={() => setShowForm(false)} variant="secondary">Cancel</Button>
          </div>
        </div>
      ) : (
        <Button onClick={() => setShowForm(true)}>New Alert</Button>
      )}
    </Card>
  );
}
