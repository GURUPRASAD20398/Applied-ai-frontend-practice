import api from './api';

const get = async (url, params) => (await api.get(url, { params })).data;

export const bookService = {
  list: (params) => get('/books', params),
  search: (q) => get('/books/search', { q }),
  details: (id) => get(`/books/${id}`),
  facets: () => get('/books/facets'),
  categories: () => get('/categories'),
  recommendations: () => get('/recommendations'),
};

export const cartService = {
  get: () => get('/cart'),
  add: async (bookId, quantity = 1) => (await api.post('/cart', { bookId, quantity })).data,
  update: async (id, patch) => (await api.put(`/cart/${id}`, patch)).data,
  remove: async (id) => (await api.delete(`/cart/${id}`)).data,
  clear: async () => (await api.delete('/cart')).data,
  rebuy: async (orderId) => (await api.post(`/cart/rebuy/${orderId}`)).data,
};

export const wishlistService = {
  get: () => get('/wishlist'),
  add: async (bookId) => (await api.post('/wishlist', { bookId })).data,
  remove: async (bookId) => (await api.delete(`/wishlist/${bookId}`)).data,
  moveToCart: async (bookId) => (await api.post(`/wishlist/${bookId}/move-to-cart`)).data,
};

export const addressService = {
  list: () => get('/address'),
  create: async (data) => (await api.post('/address', data)).data,
  update: async (id, data) => (await api.put(`/address/${id}`, data)).data,
  setDefault: async (id) => (await api.put(`/address/${id}/default`)).data,
  remove: async (id) => (await api.delete(`/address/${id}`)).data,
};

export const orderService = {
  list: () => get('/orders'),
  details: (id) => get(`/orders/${id}`),
  preview: async (pointsToRedeem) => (await api.post('/orders/preview', { pointsToRedeem })).data,
  place: async (payload) => (await api.post('/orders', payload)).data,
};

export const paymentService = {
  pay: async (payload) => (await api.post('/payment', payload)).data,
};

export const adminService = {
  stats: () => get('/admin/stats'),
  books: () => get('/admin/books'),
  createBook: async (data) => (await api.post('/admin/books', data)).data,
  updateBook: async (id, data) => (await api.put(`/admin/books/${id}`, data)).data,
  deleteBook: async (id) => (await api.delete(`/admin/books/${id}`)).data,
};
