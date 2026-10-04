import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import DashboardSidebar from '@/components/DashboardSidebar/DashboardSidebar';
import DashboardHeader from '@/components/DashboardHeader/DashboardHeader';
import { userNavSections } from '@/features/dashboard/userNavConfig';
import { getProducts, addToCart, type Product } from './shopService';
import './ShopPage.css';

const ShopPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    getProducts().then(setProducts);
  }, []);

  const handleAddToCart = async (e: React.MouseEvent, productId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setMessage('');
    try {
      await addToCart(productId, 1);
      setMessage('Added to cart!');
      setTimeout(() => setMessage(''), 2000);
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Could not add to cart.');
    }
  };

  return (
    <div className="dash-layout">
      <DashboardSidebar portalLabel="MY SPACE" sections={userNavSections} homePath="/dashboard" />

      <main className="dash-main">
        <div className="dash-widget-header-row">
          <DashboardHeader title="Divine Shop" subtitle="Products to support your spiritual journey." />
          <Link to="/dashboard/cart" className="dash-widget-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShoppingCart size={18} /> View Cart
          </Link>
        </div>

        {message && <p style={{ color: 'green', marginBottom: 'var(--spacing-md)' }}>{message}</p>}

        <div className="shop-grid">
          {products.map((product) => (
            <Link key={product.id} to={`/dashboard/shop/${product.id}`} className="shop-card">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="shop-card-image" />
              ) : (
                <div className="shop-card-image-placeholder">No image</div>
              )}
              <h3 className="course-card-title">{product.name}</h3>
              <p className="course-card-price">₹{product.price}</p>
              <p className="admin-activity-meta">{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</p>
              <button
                className="dash-widget-btn"
                onClick={(e) => handleAddToCart(e, product.id)}
                disabled={product.stock === 0}
                style={{ marginTop: 'var(--spacing-sm)', width: '100%' }}
              >
                Add to Cart
              </button>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
};

export default ShopPage;