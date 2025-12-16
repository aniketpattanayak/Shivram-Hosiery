'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiPlus, FiShoppingCart } from 'react-icons/fi';
import api from '@/utils/api';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🟢 FETCH LOGIC (Moved from old SalesPage)
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sales/orders');
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="p-6 animate-in fade-in">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Sales Orders</h1>
          <p className="text-slate-500 text-sm">Track active orders and dispatch status.</p>
        </div>
        <Link 
          href="/sales/orders/new" 
          className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-800 shadow-lg"
        >
          <FiPlus /> Create Order
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs border-b">
            <tr>
              <th className="p-4">Order ID</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Date</th>
              <th className="p-4">Status</th>
              <th className="p-4">Items</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((order) => (
              <tr key={order._id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-bold text-blue-600">{order.orderId || 'SO-###'}</td>
                <td className="p-4 font-bold text-slate-800">{order.customerName}</td>
                <td className="p-4 text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    order.status === 'Production_Queued' ? 'bg-purple-50 text-purple-700' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {order.status || 'Draft'}
                  </span>
                </td>
                <td className="p-4 text-slate-500">{order.items?.length || 0}</td>
              </tr>
            ))}
            {orders.length === 0 && !loading && (
              <tr>
                <td colSpan="5" className="p-12 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <FiShoppingCart size={32} className="text-slate-200" />
                    <p>No orders found.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}