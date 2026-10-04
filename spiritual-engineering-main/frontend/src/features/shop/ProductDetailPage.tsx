import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import DashboardSidebar from '@/components/DashboardSidebar/DashboardSidebar';
import DashboardHeader from '@/components/DashboardHeader/DashboardHeader';
import { userNavSections } from '@/features/dashboard/userNavConfig';
import { getProductById, addToCart, type Product } from './shopService';
import './ProductDetailPage.css';

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (!id) return;
    getProductById(id).then(setProduct);
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;
    setMessage('');
    setIsAdding(true);
    try {
      await addToCart(product.id, quantity);
      setMessage('Added to cart!');
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Could not add to cart.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleGoToCart = () => {
    navigate('/dashboard/cart');
  };

  if (!product) {
    return (
      <div className="dash-layout">
        <DashboardSidebar portalLabel="MY SPACE" sections={userNavSections} homePath="/dashboard" />
        <main className="dash-main">
          <p className="loading-state">Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="dash-layout">
      <DashboardSidebar portalLabel="MY SPACE" sections={userNavSections} homePath="/dashboard" />

      <main className="dash-main">
        <DashboardHeader title={product.name} subtitle="Product details." />

        <div className="product-detail-card">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="product-detail-image" />
          ) : (
            <div className="shop-card-image-placeholder" style={{ height: 280 }}>No image</div>
          )}

          <div className="product-detail-info">
            <p className="course-buy-price">₹{product.price}</p>
            <p className="admin-widget-subtext">{product.description}</p>
            <p className="admin-activity-meta">
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </p>

            {product.stock > 0 && (
              <div className="product-detail-actions">
                <input
                  type="number"
                  min={1}
                  max={product.stock}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  className="cart-quantity-input"
                />

                <button onClick={handleAddToCart} className="dash-widget-btn" disabled={isAdding}>
                  {isAdding ? 'Adding...' : 'Add to Cart'}
                </button>

                <button
                  onClick={handleGoToCart}
                  className="dash-widget-btn"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <ShoppingCart size={18} /> Go to Cart
                </button>
              </div>
            )}

            {message && <p style={{ color: 'green', marginTop: 'var(--spacing-sm)' }}>{message}</p>}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductDetailPage;