import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardSidebar from '@/components/DashboardSidebar/DashboardSidebar';
import DashboardHeader from '@/components/DashboardHeader/DashboardHeader';
import { adminNavSections } from './adminNavConfig';
import { getProducts, updateProduct, deleteProduct, type Product } from '@/features/shop/shopService';

type StatusFilter = 'all' | 'draft' | 'published';

const ManageProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');

  const loadProducts = (filter: StatusFilter) => {
    getProducts(filter === 'all' ? undefined : filter).then(setProducts);
  };

  useEffect(() => {
    loadProducts(activeFilter);
  }, [activeFilter]);

  const handleStatusChange = async (product: Product, newStatus: 'draft' | 'published') => {
    await updateProduct(product.id, { status: newStatus });
    loadProducts(activeFilter);
  };

  const handleDelete = async (productId: number) => {
    await deleteProduct(productId);
    loadProducts(activeFilter);
  };

  return (
    <div className="dash-layout">
      <DashboardSidebar portalLabel="ADMIN PORTAL" sections={adminNavSections} homePath="/admin" />

      <main className="dash-main">
        <div className="dash-widget-header-row">
          <DashboardHeader title="Manage Shop" subtitle="Add and manage products." />
          <Link to="/admin/shop/create" className="dash-widget-btn">+ New Product</Link>
        </div>

        <div className="med-category-tabs">
          {(['all', 'published', 'draft'] as StatusFilter[]).map((filter) => (
            <button
              key={filter}
              className={activeFilter === filter ? 'med-tab med-tab-active' : 'med-tab'}
              onClick={() => setActiveFilter(filter)}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>

        <div className="lessons-list">
          {products.length === 0 ? (
            <p className="admin-widget-subtext">No products found for this filter.</p>
          ) : (
            products.map((product) => (
              <div key={product.id} className="lesson-row">
                <div className="lesson-info">
                  <p className="admin-activity-text">{product.name}</p>
                  <p className="admin-activity-meta">
                    ₹{product.price} · Stock: {product.stock} ·{' '}
                    <span className={`status-pill status-${product.status}`}>{product.status}</span>
                  </p>
                </div>

                <select
                  value={product.status}
                  onChange={(e) => handleStatusChange(product, e.target.value as 'draft' | 'published')}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>

                <button onClick={() => handleDelete(product.id)} className="lesson-delete-btn" aria-label="Delete product">
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default ManageProductsPage;