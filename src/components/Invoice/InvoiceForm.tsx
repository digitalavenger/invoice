// Path: digitalavenger/invoice/invoice-8778080b2e82e01b0e0b1db4cbffc77385999a44/src/components/Invoice/InvoiceForm.tsx

import React, { useState, useEffect } from 'react';
// Import getDoc for reading a single document
import { collection, addDoc, updateDoc, doc, getDoc, getDocs, query, orderBy, limit, runTransaction } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { Invoice, InvoiceItem, Customer, CompanySettings } from '../../types';
import { format } from 'date-fns';
import { Plus, Trash2, Save, Download } from 'lucide-react';
import { generatePDF } from '../../utils/pdfGenerator';

interface InvoiceFormProps {
  invoice?: Invoice;
  onSave?: (invoice: Invoice) => void;
  onCancel?: () => void;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ invoice, onSave, onCancel }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  
  const [formData, setFormData] = useState<Partial<Invoice>>({
    invoiceNumber: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    dueDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    customerId: '',
    customer: {
      name: '',
      address: '',
      phone: '',
      email: '',
      gst: ''
    },
    items: [
      {
        id: '1',
        description: '',
        quantity: 1,
        rate: 0,
        amount: 0,
        gstRate: 18,
        gstAmount: 0
      }
    ],
    subtotal: 0,
    totalGst: 0,
    total: 0,
    notes: '',
    status: 'draft'
  });

  useEffect(() => {
    // Fetch customers and company settings first on component mount
    fetchCustomers();
    fetchCompanySettings();
  }, []);

  useEffect(() => {
    // This effect runs when the 'invoice' prop changes (for editing)
    // or when 'companySettings' or 'currentUser' become available (for new invoice numbering)
    if (invoice) {
      setFormData(invoice); // If editing, load existing invoice data
    } else {
      // If creating a new invoice, generate the initial invoice number for display
      // only after company settings and current user are loaded
      if (companySettings && currentUser?.uid) {
        // We only fetch the *next* number for display, not increment the DB yet
        generateNextInvoiceNumberForDisplay();
      }
    }
  }, [invoice, companySettings, currentUser]); // Depend on these states/props

  // This function only fetches the next sequential invoice number for DISPLAY.
  // It DOES NOT increment the counter in the database yet.
  const generateNextInvoiceNumberForDisplay = async () => {
    // Fallback if settings or user are not loaded
    if (!currentUser?.uid || !companySettings?.invoicePrefix) {
      console.warn('Cannot generate invoice number for display: Company settings or user not loaded yet.');
      setFormData(prev => ({
        ...prev,
        invoiceNumber: `${companySettings?.invoicePrefix || 'INV'}INV${new Date().getFullYear()}${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}` // Fallback random
      }));
      return;
    }

    try {
      const currentYear = new Date().getFullYear();
      // Reference to the specific yearly counter document
      const counterDocRef = doc(db, `users/${currentUser.uid}/invoice_counters`, String(currentYear));
      
      // Use getDoc to read a single document
      const counterDoc = await getDoc(counterDocRef);
      let currentCount = 0;

      // If the counter document exists, get its currentCount; otherwise, it's 0 (meaning next will be 1)
      if (counterDoc.exists()) {
        currentCount = counterDoc.data()?.currentCount || 0;
      }

      // Calculate the next number for display (currentCount + 1)
      const nextSequenceNumber = currentCount + 1; 

      // Pad the number with leading zeros (e.g., 1 -> "0001", 13 -> "0013")
      const paddedNumber = String(nextSequenceNumber).padStart(4, '0');
      
      // Construct the invoice number using prefix, year, and padded number
      const newInvoiceNumber = `${companySettings.invoicePrefix}INV${currentYear}${paddedNumber}`;
      
      setFormData(prev => ({
        ...prev,
        invoiceNumber: newInvoiceNumber
      }));
    } catch (error) {
      console.error('Error generating invoice number for display:', error);
      // Fallback in case of error during display number generation
      setFormData(prev => ({
        ...prev,
        invoiceNumber: `${companySettings.invoicePrefix || 'INV'}INV${new Date().getFullYear()}${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`
      }));
    }
  };


  const fetchCustomers = async () => {
    try {
      const customersRef = collection(db, `users/${currentUser?.uid}/customers`);
      const querySnapshot = await getDocs(customersRef);
      const customersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Customer[];
      setCustomers(customersList);
      // Debugging: Check if customers are fetched
      console.log('Fetched customers:', customersList);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchCompanySettings = async () => {
    try {
      const settingsRef = collection(db, `users/${currentUser?.uid}/settings`);
      const querySnapshot = await getDocs(settingsRef);
      if (!querySnapshot.empty) {
        const settings = querySnapshot.docs[0].data() as CompanySettings;
        setCompanySettings(settings);
        // Debugging: Check if company settings are fetched
        console.log('Fetched company settings:', settings);
      } else {
        // If no settings document exists, provide a default invoicePrefix
        // Ensure all properties match CompanySettings interface to avoid type errors in other parts
        setCompanySettings({ 
          invoicePrefix: 'INV',
          name: '', address: '', phone: '', email: '', website: '', gst: '', pan: '', logoUrl: '',
          bankName: '', accountNumber: '', ifscCode: '', branchName: ''
        } as CompanySettings);
      }
    } catch (error) {
      console.error('Error fetching company settings:', error);
      // Fallback on error, ensure all properties are present
      setCompanySettings({ 
        invoicePrefix: 'INV',
        name: '', address: '', phone: '', email: '', website: '', gst: '', pan: '', logoUrl: '',
        bankName: '', accountNumber: '', ifscCode: '', branchName: ''
      } as CompanySettings);
    }
  };

  const handleCustomerChange = (customerId: string) => {
    const selectedCustomer = customers.find(c => c.id === customerId);
    if (selectedCustomer) {
      setFormData(prev => ({
        ...prev,
        customerId,
        customer: selectedCustomer
      }));
    }
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const items = [...(formData.items || [])];
    items[index] = {
      ...items[index],
      [field]: value
    };

    // Recalculate amounts when quantity, rate, or gstRate changes
    if (field === 'quantity' || field === 'rate' || field === 'gstRate') {
      const quantity = Number(items[index].quantity);
      const rate = Number(items[index].rate);
      const gstRate = Number(items[index].gstRate);
      
      const amount = quantity * rate;
      const gstAmount = (amount * gstRate) / 100;
      
      items[index].amount = amount;
      items[index].gstAmount = gstAmount;
    }

    // Recalculate totals after item change
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const totalGst = items.reduce((sum, item) => sum + item.gstAmount, 0);
    const total = subtotal + totalGst;

    setFormData(prev => ({
      ...prev,
      items,
      subtotal,
      totalGst,
      total
    }));
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(), // Unique ID for new item
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0,
      gstRate: 18,
      gstAmount: 0
    };

    setFormData(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem]
    }));
  };

  const removeItem = (index: number) => {
    const items = [...(formData.items || [])];
    items.splice(index, 1); // Remove item at specified index

    // Recalculate totals after item removal
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const totalGst = items.reduce((sum, item) => sum + item.gstAmount, 0);
    const total = subtotal + totalGst;

    setFormData(prev => ({
      ...prev,
      items,
      subtotal,
      totalGst,
      total
    }));
  };

  const handleSave = async () => {
    setLoading(true); // Start loading

    try {
      let invoiceDataToSave = {
        ...formData,
        updatedAt: new Date().toISOString(), // Always update 'updatedAt'
        createdAt: formData.createdAt || new Date().toISOString() // Set 'createdAt' only if new invoice
      };

      if (invoice?.id) {
        // If 'invoice.id' exists, it's an UPDATE of an existing invoice
        await updateDoc(doc(db, `users/${currentUser?.uid}/invoices`, invoice.id), invoiceDataToSave);
      } else {
        // If 'invoice.id' does NOT exist, it's a CREATE of a new invoice
        if (!currentUser?.uid || !companySettings?.invoicePrefix) {
          throw new Error('User or company settings not loaded for new invoice creation. Cannot save.');
        }

        const currentYear = new Date().getFullYear();
        const counterDocRef = doc(db, `users/${currentUser.uid}/invoice_counters`, String(currentYear));
        
        let finalInvoiceNumber: string = ''; // Initialize to ensure it's defined

        // Use a Firestore transaction to atomically increment the counter
        await runTransaction(db, async (transaction) => {
          const counterDoc = await transaction.get(counterDocRef);
          let nextSequenceNumber: number;

          if (!counterDoc.exists()) {
            // If counter for the current year doesn't exist, start from 1
            nextSequenceNumber = 1;
            transaction.set(counterDocRef, { currentCount: nextSequenceNumber });
          } else {
            // Increment existing counter
            const data = counterDoc.data();
            nextSequenceNumber = (data?.currentCount || 0) + 1; // Ensure default to 0 if undefined
            transaction.update(counterDocRef, { currentCount: nextSequenceNumber });
          }
          
          // Format the number using the incremented sequence
          const paddedNumber = String(nextSequenceNumber).padStart(4, '0');
          finalInvoiceNumber = `${companySettings.invoicePrefix}INV${currentYear}${paddedNumber}`;
        });

        // Assign the newly generated and incremented invoice number to the data before adding
        invoiceDataToSave = {
          ...invoiceDataToSave,
          invoiceNumber: finalInvoiceNumber // Use the number generated by the transaction
        };

        // Add the new invoice document to Firestore
        await addDoc(collection(db, `users/${currentUser?.uid}/invoices`), invoiceDataToSave);
      }

      onSave?.(invoiceDataToSave as Invoice); // Call onSave callback with the final saved invoice data
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert(`Error saving invoice: ${error.message || 'Please try again.'}`);
    } finally {
      setLoading(false); // End loading
    }
  };

  const handleDownloadPDF = async () => {
    if (!companySettings) {
      alert('Please configure company settings first');
      return;
    }

    try {
      await generatePDF(formData as Invoice, companySettings);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {invoice ? 'Edit Invoice' : 'New Invoice'}
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Invoice'}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Invoice Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invoice Number
            </label>
            <input
              type="text"
              value={formData.invoiceNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer
            </label>
            <select
              value={formData.customerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a customer</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Customer Details */}
        {formData.customer && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.customer.name}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customer: { ...prev.customer!, name: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.customer.email}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customer: { ...prev.customer!, email: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  value={formData.customer.phone}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customer: { ...prev.customer!, phone: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GST Number
                </label>
                <input
                  type="text"
                  value={formData.customer.gst || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customer: { ...prev.customer!, gst: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  value={formData.customer.address}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customer: { ...prev.customer!, address: e.target.value }
                  }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Invoice Items */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Invoice Items</h3>
            <button
              onClick={addItem}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Item
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GST %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {formData.items?.map((item, index) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Item description"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                        className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        min="1"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={item.rate}
                        onChange={(e) => handleItemChange(index, 'rate', Number(e.target.value))}
                        className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={item.gstRate}
                        onChange={(e) => handleItemChange(index, 'gstRate', Number(e.target.value))}
                        className="w-16 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        min="0"
                        max="100"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{item.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formData.items && formData.items.length > 1 && (
                        <button
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invoice Totals */}
        <div className="flex justify-end">
          <div className="w-72 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">₹{formData.subtotal?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total GST:</span>
              <span className="font-medium">₹{formData.totalGst?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>₹{formData.total?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Additional notes or terms..."
          />
        </div>
      </div>
    </div>
  );
};

export default InvoiceForm;