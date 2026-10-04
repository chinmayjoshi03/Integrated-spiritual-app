import axiosInstance from '../../services/axiosInstance';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  stock: number;
  image_url: string | null;
  status: 'draft' | 'published';
  created_at: string;
}

export interface CartItem {
  id: number;
  quantity: number;
  product_id: number;
  name: string;
  price: string;
  image_url: string | null;
  stock: number;
}

export interface OrderItem {
  id: number;
  product_id: number | null;
  product_name: string;
  price_at_purchase: string;
  quantity: number;
}

export interface Order {
  id: number;
  total_amount: string;
  status: 'pending' | 'paid' | 'shipped' | 'cancelled';
  shipping_address: string | null;
  created_at: string;
  items: OrderItem[];
}

export const getProducts = async (status?: string): Promise<Product[]> => {
  const response = await axiosInstance.get('/products', { params: status ? { status } : {} });
  return response.data.products;
};

export const getProductById = async (id: string): Promise<Product> => {
  const response = await axiosInstance.get(`/products/${id}`);
  return response.data.product;
};

export const createProduct = async (formData: FormData) => {
    const response = await axiosInstance.post('/products', formData, {
      headers: { 'Content-Type': undefined },
    });
    return response.data;
  };

export const updateProduct = async (
  id: number,
  payload: Partial<{ name: string; description: string; price: number; stock: number; status: 'draft' | 'published' }>
) => {
  const response = await axiosInstance.patch(`/products/${id}`, payload);
  return response.data;
};

export const deleteProduct = async (id: number) => {
  const response = await axiosInstance.delete(`/products/${id}`);
  return response.data;
};

export const getCart = async (): Promise<CartItem[]> => {
  const response = await axiosInstance.get('/cart');
  return response.data.items;
};

export const addToCart = async (productId: number, quantity: number = 1) => {
  const response = await axiosInstance.post('/cart', { productId, quantity });
  return response.data;
};

export const updateCartItem = async (itemId: number, quantity: number) => {
  const response = await axiosInstance.patch(`/cart/${itemId}`, { quantity });
  return response.data;
};

export const removeCartItem = async (itemId: number) => {
  const response = await axiosInstance.delete(`/cart/${itemId}`);
  return response.data;
};

export const checkout = async (shippingAddress: string) => {
  const response = await axiosInstance.post('/orders/checkout', { shippingAddress });
  return response.data;
};

export const getMyOrders = async (): Promise<Order[]> => {
  const response = await axiosInstance.get('/orders/my-orders');
  return response.data.orders;
};