import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardSidebar from '@/components/DashboardSidebar/DashboardSidebar';
import DashboardHeader from '@/components/DashboardHeader/DashboardHeader';
import { adminNavSections } from './adminNavConfig';
import { createProduct } from '@/features/shop/shopService';

const CreateProductPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !price) {
      setError('Product name and price are required.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('price', price);
      formData.append('stock', stock || '0');
      if (image) formData.append('image', image);

      await createProduct(formData);
      navigate('/admin/shop');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dash-layout">
      <DashboardSidebar portalLabel="ADMIN PORTAL" sections={adminNavSections} homePath="/admin" />

      <main className="dash-main">
        <DashboardHeader title="Add Product" subtitle="Add a new product to the shop." />

        <form onSubmit={handleSubmit} className="upload-form">
          <div className="upload-field">
            <label>Product Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="upload-field">
            <label>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          </div>

          <div className="upload-field-row">
            <div className="upload-field">
              <label>Price (₹)</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>

            <div className="upload-field">
              <label>Stock Quantity</label>
              <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} />
            </div>
          </div>

          <div className="upload-field">
            <label>Product Image</label>
            <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files ? e.target.files[0] : null)} />
          </div>

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="dash-widget-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Product'}
          </button>
        </form>
      </main>
    </div>
  );
};

export default CreateProductPage;