// Path: digitalavenger/invoice/invoice-8778080b2e82e01b0e0b1db4cbffc77385999a44/src/pages/DashboardPage.tsx

import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { Invoice } from '../types';
import { format } from 'date-fns';
import { Eye, Edit, CheckCircle, Clock, XCircle, LayoutDashboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalInvoicesSent, setTotalInvoicesSent] = useState(0);
  const [totalInvoiceAmount, setTotalInvoiceAmount] = useState(0);
  const [totalReceived, setTotalReceived] = useState(0);
  const [totalPending, setTotalPending] = useState(0);

  useEffect(() => {
    if (currentUser?.uid) {
      fetchDashboardData();
    }
  }, [currentUser]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const invoicesRef = collection(db, `users/${currentUser?.uid}/invoices`);
      const querySnapshot = await getDocs(invoicesRef);
      const invoicesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Invoice[];

      // Sort invoices by creation date (newest first) for display
      invoicesList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setInvoices(invoicesList);
      calculateMetrics(invoicesList);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (invoicesList: Invoice[]) => {
    let sentCount = 0;
    let totalAmount = 0;
    let receivedAmount = 0;
    let pendingAmount = 0;

    invoicesList.forEach(invoice => {
      // "Invoices Sent" includes both 'sent' and 'paid'
      if (invoice.status === 'sent' || invoice.status === 'paid') {
        sentCount++;
      }
      totalAmount += invoice.total;
      
      if (invoice.status === 'paid') {
        receivedAmount += invoice.total;
      } else { // Includes 'draft' and 'sent' as pending for calculation
        pendingAmount += invoice.total;
      }
    });

    setTotalInvoicesSent(sentCount);
    setTotalInvoiceAmount(totalAmount);
    setTotalReceived(receivedAmount);
    setTotalPending(pendingAmount);
  };

  const handleStatusUpdate = async (invoiceId: string, newStatus: 'draft' | 'sent' | 'paid') => {
    if (!currentUser?.uid) return;
    try {
      await updateDoc(doc(db, `users/${currentUser.uid}/invoices`, invoiceId), { status: newStatus, updatedAt: new Date().toISOString() });
      fetchDashboardData(); // Re-fetch data to update metrics and table
      alert(`Invoice status updated to: ${newStatus.toUpperCase()}`);
    } catch (error) {
      console.error('Error updating invoice status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  const handleViewInvoice = (invoiceId: string) => {
    navigate(`/invoices?view=${invoiceId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getStatusColorClass = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="text-gray-600">Overview of your invoices</p>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg shadow-sm">
          <p className="text-sm font-medium text-gray-500">Invoices Sent</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalInvoicesSent}</p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Invoice Amount</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">₹{totalInvoiceAmount.toFixed(2)}</p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Received</p>
          <p className="text-2xl font-bold text-green-600 mt-1">₹{totalReceived.toFixed(2)}</p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Pending</p>
          <p className="text-2xl font-bold text-red-600 mt-1">₹{totalPending.toFixed(2)}</p>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-4 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Invoices</h3>
        </div>
        {invoices.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No invoices found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice, index) => (
                  <tr key={invoice.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{invoice.invoiceNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invoice.customer.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invoice.customer.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{invoice.total.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <select
                        value={invoice.status}
                        onChange={(e) => handleStatusUpdate(invoice.id!, e.target.value as 'draft' | 'sent' | 'paid')}
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColorClass(invoice.status)}`}
                      >
                        <option value="draft">Draft</option>
                        <option value="sent">Sent</option>
                        <option value="paid">Paid</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        <button onClick={() => handleViewInvoice(invoice.id!)} className="text-indigo-600 hover:text-indigo-900">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;