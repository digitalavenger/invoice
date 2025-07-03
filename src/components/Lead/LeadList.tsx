// Path: digitalavenger/invoice/invoice-8778080b2e82e01b0e0b1db4cbffc77385999a44/src/components/Lead/LeadList.tsx

import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { Lead, ServiceOption, StatusOption } => '../../types'; // Import StatusOption
import { Edit, Trash2, PlusCircle, Search } from 'lucide-react';
import { format } from 'date-fns';

interface LeadListProps {
  onEdit: (lead: Lead) => void;
  onNew: () => void;
}

// Service options will be fetched dynamically for filter dropdown
// No longer need hardcoded serviceOptions array here

const LeadList: React.FC<LeadListProps> = ({ onEdit, onNew }) => {
  const { currentUser } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  // Filter states
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | ''>('');
  const [filterService, setFilterService] = useState<string | ''>(''); // Changed to string for dynamic services

  // Dynamic options for filters
  const [availableStatuses, setAvailableStatuses] = useState<StatusOption[]>([]);
  const [availableServicesForFilter, setAvailableServicesForFilter] = useState<ServiceOption[]>([]); // For filter dropdown

  useEffect(() => {
    if (currentUser?.uid) {
      fetchLeads();
      fetchAvailableStatuses();
      fetchAvailableServicesForFilter();
    }
  }, [currentUser]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const leadsRef = collection(db, `users/${currentUser?.uid}/leads`);
      const querySnapshot = await getDocs(leadsRef);
      const leadsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Lead[];
      setLeads(leadsList);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
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
      // Fallback to hardcoded statuses if fetching fails (ensure IDs for keys)
      setAvailableStatuses([
        { id: 'default_created', name: 'Created', order: 1, isDefault: true, color: '#2563EB' },
        { id: 'default_followup', name: 'Followup', order: 2, color: '#FBBF24' },
        { id: 'default_client', name: 'Client', order: 3, color: '#10B981' },
        { id: 'default_rejected', name: 'Rejected', order: 4, color: '#EF4444' },
      ]);
    }
  };

  const fetchAvailableServicesForFilter = async () => {
    if (!currentUser?.uid) return;
    try {
      const servicesRef = collection(db, `users/${currentUser.uid}/service_options`);
      const q = query(servicesRef, orderBy('createdAt', 'asc'));
      const querySnapshot = await getDocs(q);
      const servicesList = querySnapshot.docs.map(d => ({ id: d.id, name: d.data().name })) as ServiceOption[];
      setAvailableServicesForFilter(servicesList);
    } catch (error) {
      console.error('Error fetching available services for filter:', error);
      // Fallback to hardcoded services if fetching fails
      setAvailableServicesForFilter([
        { id: 'seo', name: 'SEO' }, { id: 'ppc', name: 'PPC' },
        { id: 'smm', name: 'Social Media Marketing' }, { id: 'other', name: 'Other' }
      ]);
    }
  };

  const handleDelete = async (leadId: string) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) {
      return;
    }
    if (!currentUser?.uid) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, `users/${currentUser.uid}/leads`, leadId));
      setLeads(prev => prev.filter(lead => lead.id !== leadId));
    } catch (error) {
      console.error('Error deleting lead:', error);
      alert('Failed to delete lead. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle inline status update
  const handleStatusChange = async (leadId: string, newStatus: string) => {
    if (!currentUser?.uid) return;
    try {
      await updateDoc(doc(db, `users/${currentUser.uid}/leads`, leadId), { 
        leadStatus: newStatus,
        updatedAt: new Date().toISOString()
      });
      setLeads(prevLeads => prevLeads.map(lead =>
        lead.id === leadId ? { ...lead, leadStatus: newStatus } : lead
      ));
    } catch (error) {
      console.error('Error updating lead status:', error);
      alert('Failed to update lead status. Please try again.');
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.emailAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.mobileNumber.includes(searchTerm);

    const matchesDate = filterDate ? lead.leadDate === filterDate : true;
    const matchesStatus = filterStatus ? lead.leadStatus === filterStatus : true;
    const matchesService = filterService ? lead.serviceRequired.includes(filterService) : true;

    return matchesSearch && matchesDate && matchesStatus && matchesService;
  });

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  // Helper to get status color dynamically from availableStatuses
  const getLeadStatusColor = (statusName: string) => {
    const statusOption = availableStatuses.find(s => s.name === statusName);
    const defaultColor = 'bg-gray-100 text-gray-800'; // Fallback Tailwind classes
    if (statusOption && statusOption.color) {
      // Convert hex to background color style
      // For dynamically generated styles based on hex, inline style or utility class mapping is needed
      // Here we return the raw hex for inline style or map to a pre-defined Tailwind class
      // For full flexibility, you'd define CSS variables or use a utility like tinycolor2
      return `color: ${statusOption.color}; border: 1px solid ${statusOption.color}; background-color: ${statusOption.color}1A;`; // 1A is ~10% opacity for light background
    }
    // Fallback for default statuses or if color is missing
    switch (statusName) {
      case 'Created': return 'bg-blue-100 text-blue-800';
      case 'Followup': return 'bg-yellow-100 text-yellow-800';
      case 'Client': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return defaultColor;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads Management</h1>
          <p className="text-gray-600">Track and manage your potential clients</p>
        </div>
        <button
          onClick={onNew}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusCircle className="w-4 h-4 mr-2" /> Add New Lead
        </button>
      </div>

      {/* Filter Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            {availableStatuses.map(status => (
              <option key={status.id} value={status.name}>{status.name}</option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={filterService}
            onChange={(e) => setFilterService(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Services</option>
            {availableServicesForFilter.map(service => (
              <option key={service.id} value={service.name}>{service.name}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredLeads.length === 0 ? (
        <div className="text-center py-10 text-gray-500">No leads found matching your criteria.</div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Required</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeads.map((lead, index) => (
                <tr key={lead.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{lead.leadName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(new Date(lead.leadDate), 'MMM dd,yyyy')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.mobileNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.emailAddress}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.serviceRequired.join(', ')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {lead.budget ? `₹${lead.budget.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {/* Inline Status Update Dropdown */}
                    <select
                      value={lead.leadStatus}
                      onChange={(e) => handleStatusChange(lead.id!, e.target.value)}
                      style={availableStatuses.find(s => s.name === lead.leadStatus)?.color ? { backgroundColor: availableStatuses.find(s => s.name === lead.leadStatus)?.color + '1A', color: availableStatuses.find(s => s.name === lead.leadStatus)?.color, borderColor: availableStatuses.find(s => s.name === lead.leadStatus)?.color } : {}}
                      className={`px-2 py-1 text-xs font-semibold rounded-full focus:outline-none ${!availableStatuses.find(s => s.name === lead.leadStatus)?.color ? 'bg-gray-100 text-gray-800' : ''}`} // Fallback Tailwind classes if no custom color
                    >
                      {availableStatuses.map(status => (
                        <option key={status.id} value={status.name}>{status.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2">
                      <button onClick={() => onEdit(lead)} className="text-indigo-600 hover:text-indigo-900">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(lead.id!)} className="text-red-600 hover:text-red-900">
                        <Trash2 className="w-4 h-4" />
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
  );
};

// Simplified to use dynamic colors from availableStatuses
const getLeadStatusColor = (statusName: string) => {
  // This function is now mostly a fallback if inline style is not used or availableStatuses not loaded
  // The inline style in the JSX handles the custom color directly.
  switch (statusName) {
    case 'Created': return 'bg-blue-100 text-blue-800';
    case 'Followup': return 'bg-yellow-100 text-yellow-800';
    case 'Client': return 'bg-green-100 text-green-800';
    case 'Rejected': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default LeadList;