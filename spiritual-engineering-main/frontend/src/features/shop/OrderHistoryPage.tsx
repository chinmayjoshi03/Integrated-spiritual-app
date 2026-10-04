import { useState, useEffect } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar/DashboardSidebar';
import DashboardHeader from '@/components/DashboardHeader/DashboardHeader';
import { userNavSections } from '@/features/dashboard/userNavConfig';
import { getMyOrders, type Order } from './shopService';

const OrderHistoryPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    getMyOrders().then(setOrders);
  }, []);

  return (
    <div className="dash-layout">
      <DashboardSidebar portalLabel="MY SPACE" sections={userNavSections} homePath="/dashboard" />

      <main className="dash-main">
        <DashboardHeader title="My Orders" subtitle="Your order history." />

        {orders.length === 0 ? (
          <p className="admin-widget-subtext">You haven't placed any orders yet.</p>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="admin-widget-card" style={{ marginBottom: 'var(--spacing-lg)' }}>
              <div className="dash-widget-header-row">
                <p className="admin-activity-text">Order #{order.id}</p>
                <span className={`status-pill status-${order.status === 'paid' ? 'published' : 'draft'}`}>
                  {order.status}
                </span>
              </div>
              <p className="admin-activity-meta">
                {new Date(order.created_at).toLocaleDateString()} · Total: ₹{order.total_amount}
              </p>

              <div className="lessons-list" style={{ marginTop: 'var(--spacing-md)' }}>
                {order.items.map((item) => (
                  <div key={item.id} className="lesson-row">
                    <div className="lesson-info">
                      <p className="admin-activity-text">{item.product_name}</p>
                      <p className="admin-activity-meta">
                        ₹{item.price_at_purchase} × {item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
};

export default OrderHistoryPage;