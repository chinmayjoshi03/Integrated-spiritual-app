import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import DashboardSidebar from '@/components/DashboardSidebar/DashboardSidebar';
import DashboardHeader from '@/components/DashboardHeader/DashboardHeader';
import { userNavSections } from '@/features/dashboard/userNavConfig';
import { getCart, updateCartItem, removeCartItem, checkout, type CartItem } from './shopService';
import './CartPage.css';

const CartPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const loadCart = () => {
    getCart().then(setItems);
  };

  useEffect(() => {
    loadCart();
  }, []);

  const total = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  const handleQuantityChange = async (itemId: number, quantity: number) => {
    if (quantity < 1) return;
    await updateCartItem(itemId, quantity);
    loadCart();
  };

  const handleRemove = async (itemId: number) => {
    await removeCartItem(itemId);
    loadCart();
  };

  const handleCheckout = async () => {
    if (!address) {
      setError('Please enter a shipping address.');
      return;
    }

    setError('');
    setIsCheckingOut(true);

    try {
      await checkout(address);
      navigate('/dashboard/orders');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Checkout failed. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="dash-layout">
      <DashboardSidebar portalLabel="MY SPACE" sections={userNavSections} homePath="/dashboard" />

      <main className="dash-main">
        <DashboardHeader title="Cart" subtitle="Review your items before checkout." />

        {items.length === 0 ? (
          <p className="admin-widget-subtext">Your cart is empty.</p>
        ) : (
          <>
            <div className="lessons-list">
              {items.map((item) => (
                <div key={item.id} className="lesson-row">
                  <div className="lesson-info">
                    <p className="admin-activity-text">{item.name}</p>
                    <p className="admin-activity-meta">₹{item.price} each</p>
                  </div>

                  <input
                    type="number"
                    min={1}
                    max={item.stock}
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(item.id, Number(e.target.value))}
                    className="cart-quantity-input"
                  />

                  <p className="admin-activity-text">₹{(Number(item.price) * item.quantity).toFixed(2)}</p>

                  <button onClick={() => handleRemove(item.id)} className="lesson-delete-btn" aria-label="Remove item">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            <div className="cart-checkout-box">
              <p className="course-buy-price">Total: ₹{total.toFixed(2)}</p>

              <div className="upload-field">
                <label>Shipping Address</label>
                <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} />
              </div>

              {error && <p className="error-text">{error}</p>}

              <button onClick={handleCheckout} className="dash-widget-btn" disabled={isCheckingOut}>
                {isCheckingOut ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default CartPage;