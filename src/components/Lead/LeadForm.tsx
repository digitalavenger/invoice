// Path: digitalavenger/invoice/invoice-8778080b2e82e01b0e0b1db4cbffc77385999a44/src/components/Lead/LeadForm.tsx

import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { Lead, ServiceOption, StatusOption, LeadStatus } from '../../types';
import { Save, X } from 'lucide-react';

interface LeadFormProps {
  lead?: Lead;
  onSave?: () => void;
  onCancel?: () => void;
}

const LeadForm: React.FC<LeadFormProps> = ({ lead, onSave, onCancel }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  // Dynamic options
  const [availableServices, setAvailableServices] = useState<ServiceOption[]>([]);
  const [availableStatuses, setAvailableStatuses] = useState<StatusOption[]>([]);

  const [formData, setFormData] = useState<Partial<Lead>>({
    leadName: '',
    leadDate: new Date().toISOString().substring(0, 10),
    mobileNumber: '',
    emailAddress: '',
    serviceRequired: [],
    budget: undefined,
    leadStatus: LeadStatus.CREATED, // Use enum for default on new lead
    notes: '',
  });

  useEffect(() => {
    if (lead) {
      setFormData(lead);
    } else {
      // Set initial default status if no lead is being edited
      setFormData(prev => ({ ...prev, leadStatus: availableStatuses.find(s => s.isDefault)?.name || LeadStatus.CREATED }));
    }
  }, [lead, availableStatuses]);

  useEffect(() => {
    if (currentUser?.uid) {
      fetchAvailableServices();
      fetchAvailableStatuses();
    }
  }, [currentUser]);

  const fetchAvailableServices = async () => {
    if (!currentUser?.uid) return;
    try {
      const servicesRef = collection(db, `users/${currentUser.uid}/service_options`);
      const q = query(servicesRef, orderBy('createdAt', 'asc'));
      const querySnapshot = await getDocs(q);
      const servicesList = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as ServiceOption[];
      setAvailableServices(servicesList);
    } catch (error) {
      console.error('Error fetching available services:', error);
      // Fallback to hardcoded services if fetching fails
      setAvailableServices([
        { id: 'seo', name: 'SEO' }, { id: 'ppc', name: 'PPC' },
        { id: 'smm', name: 'Social Media Marketing' }, { id: 'other', name: 'Other' }
      ]);
    }
  };

  const fetchAvailableStatuses = async () => {
    if (!currentUser?.uid) return;
    try {
      const statusesRef = collection(db, `users/${currentUser.uid}/status_options`);
      const q = query(statusesRef, orderBy('order', 'asc'), orderBy('createdAt', 'asc'));
      const querySnapshot = await getDocs(q);
      const statusesList = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as StatusOption[];
      setAvailableStatuses(statusesList);
    } catch (error) {
      console.error('Error fetching available statuses:', error);
      // Fallback to hardcoded statuses if fetching fails
      setAvailableStatuses([
        { id: 'default_created', name: LeadStatus.CREATED, order: 1, isDefault: true, color: '#2563EB' },
        { id: 'default_followup', name: LeadStatus.FOLLOWUP, order: 2, color: '#FBBF24' },
        { id: 'default_client', name: LeadStatus.CLIENT, order: 3, color: '#10B981' },
        { id: 'default_rejected', name: LeadStatus.REJECTED, order: 4, color: '#EF4444' },
      ]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(e.target.options);
    const selectedServices = options.filter(option => option.selected).map(option => option.value);
    setFormData(prev => ({ ...prev, serviceRequired: selectedServices }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (!currentUser?.uid) {
      alert("You must be logged in to save leads.");
      setLoading(false);
      return;
    }

    try {
      const leadData = {
        ...formData,
        updatedAt: new Date().toISOString(),
        createdAt: formData.createdAt || new Date().toISOString(),
        budget: formData.budget ? Number(formData.budget) : undefined,
      };

      if (lead?.id) {
        await updateDoc(doc(db, `users/${currentUser.uid}/leads`, lead.id), leadData);
      } else {
        await addDoc(collection(db, `users/${currentUser.uid}/leads`), leadData);
      }
      onSave?.();
    } catch (error) {
      console.error("Error saving lead:", error);
      alert(`Error saving lead: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">{lead ? 'Edit Lead' : 'Add New Lead'}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Lead Name</label>
          <input type="text" name="leadName" value={formData.leadName || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Lead Date</label>
          <input type="date" name="leadDate" value={formData.leadDate || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
          <input type="text" name="mobileNumber" value={formData.mobileNumber || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email Address</label>
          <input type="email" name="emailAddress" value={formData.emailAddress || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Service Required</label>
          <select name="serviceRequired" multiple value={formData.serviceRequired || []} onChange={handleMultiSelectChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 h-24">
            {availableServices.map(service => (
              <option key={service.id} value={service.name}>{service.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Budget (Optional)</label>
          <input type="number" name="budget" value={formData.budget || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Lead Status</label>
          <select name="leadStatus" value={formData.leadStatus || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
            {availableStatuses.map(status => (
              <option key={status.id} value={status.name}>{status.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
          <textarea name="notes" value={formData.notes || ''} onChange={handleChange} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea>
        </div>
        <div className="flex justify-end space-x-2">
          <button type="submit" disabled={loading} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
            <Save className="w-4 h-4 mr-2" /> {loading ? 'Saving...' : 'Save Lead'}
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel} className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <X className="w-4 h-4 mr-2" /> Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default LeadForm;