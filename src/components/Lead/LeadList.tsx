import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, updateDoc, query, orderBy, Timestamp } from 'firebase/firestore'; // Added Timestamp import
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { Lead, ServiceOption, StatusOption } from '../../types';
import { Edit, Trash2, PlusCircle, Search } from 'lucide-react';
import { format } from 'date-fns';

interface LeadListProps {
  onEdit: (lead: Lead) => void;
  onNew: () => void;
}

const LeadList: React.FC<LeadListProps> = ({ onEdit, onNew }) => {
  const { currentUser } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  // Filter states
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | ''>('');
  const [filterService, setFilterService] = useState<string | ''>(''); // Changed to string for dynamic services
  const [filterFollowupDate, setFilterFollowupDate] = useState(''); // NEW: Filter for followup date

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
      const q = query(leadsRef, orderBy('createdAt', 'desc')); // Order by creation time
      const querySnapshot = await getDocs(q);
      const leadsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        services: Array.isArray(doc.data().services) ? doc.data().services : [],
        notes: doc.data().notes || '',
        lastFollowUpDate: doc.data().lastFollowUpDate || '',
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
      setAvailableServicesForFilter([
        { id: 'seo', name: 'SEO' }, { id: 'ppc', name: 'PPC' },
        { id: 'smm', name: 'Social Media Marketing' }, { id: 'other', name: 'Other' }
      ]);
    }
  };

  const handleDelete = async (leadId: string) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;
    if (!currentUser?.uid) return;
    try {
      await deleteDoc(doc(db, `users/${currentUser.uid}/leads`, leadId));
      setLeads(prev => prev.filter(lead => lead.id !== leadId));
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    if (!currentUser?.uid) return;
    try {
      await updateDoc(doc(db, `users/${currentUser.uid}/leads`, leadId), {
        leadStatus: newStatus,
        updatedAt: Timestamp.now(), 
      });
      setLeads(prev =>
        prev.map(lead => (lead.id === leadId ? { ...lead, leadStatus: newStatus } : lead))
      );
    } catch (error) {
      console.error('Error updating lead status:', error);
    }
  };

  // *** NEW FUNCTION TO HANDLE INLINE DATE UPDATES ***
  const handleFollowupDateChange = async (leadId: string, newDate: string) => {
    if (!currentUser?.uid || !newDate) return;
    try {
      const leadRef = doc(db, `users/${currentUser.uid}/leads`, leadId);
      await updateDoc(leadRef, {
        lastFollowUpDate: newDate,
        updatedAt: Timestamp.now(),
      });
      // Update local state to show the change instantly without a full reload
      setLeads(prevLeads =>
        prevLeads.map(lead =>
          lead.id === leadId ? { ...lead, lastFollowUpDate: newDate } : lead
        )
      );
    } catch (error) {
      console.error('Error updating follow-up date:', error);
    }
  };

  const getStatusColorClass = (statusName: string) => {
    const status = availableStatuses.find(s => s.name === statusName);
    return status ? `bg-[${status.color}] text-white` : 'bg-gray-200 text-gray-800';
  };

  const filteredLeads = leads.filter(lead => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' ||
      lead.name.toLowerCase().includes(searchLower) ||
      lead.emailAddress.toLowerCase().includes(searchLower) ||
      lead.mobileNumber.includes(searchTerm) ||
      (lead.notes && lead.notes.toLowerCase().includes(searchLower));

    const matchesDate = filterDate === '' || lead.leadDate === filterDate;
    const matchesStatus = filterStatus === '' || lead.leadStatus === filterStatus;
    const matchesService = filterService === '' || lead.services.includes(filterService);
    const matchesFollowupDate = filterFollowupDate === '' || lead.lastFollowUpDate === filterFollowupDate;

    return matchesSearch && matchesDate && matchesStatus && matchesService && matchesFollowupDate;
  });

  if (loading) {
    return <div className="text-center py-8">Loading leads...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Leads List</h2>
        <button
          onClick={onNew}
          className="flex items-center px-4 py-2 bg-primary text-white rounded-md shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Create New Lead
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Filters remain unchanged */}
        <div>
          <label htmlFor="searchLeads" className="block text-sm font-medium text-gray-700 mb-1">Search Leads</label>
          <div className="relative">
            <input type="text" id="searchLeads" placeholder="Search by name, email, mobile, notes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"/>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-5 w-5 text-gray-400" /></div>
          </div>
        </div>
        <div>
          <label htmlFor="filterDate" className="block text-sm font-medium text-gray-700 mb-1">Filter by Lead Date</label>
          <input type="date" id="filterDate" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"/>
        </div>
        <div>
          <label htmlFor="filterStatus" className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
          <select id="filterStatus" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"><option value="">All Statuses</option>{availableStatuses.map(status => (<option key={status.id} value={status.name}>{status.name}</option>))}</select>
        </div>
        <div>
          <label htmlFor="filterService" className="block text-sm font-medium text-gray-700 mb-1">Filter by Service</label>
          <select id="filterService" value={filterService} onChange={(e) => setFilterService(e.target.value)} className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"><option value="">All Services</option>{availableServicesForFilter.map(service => (<option key={service.id} value={service.name}>{service.name}</option>))}</select>
        </div>
        <div>
          <label htmlFor="filterFollowupDate" className="block text-sm font-medium text-gray-700 mb-1">Filter by Followup Date</label>
          <input type="date" id="filterFollowupDate" value={filterFollowupDate} onChange={(e) => setFilterFollowupDate(e.target.value)} className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"/>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sr.No</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead Date</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile Number</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email Address</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Services</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">Lead Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recent Followup Date</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">No leads found.</td>
              </tr>
            ) : (
              filteredLeads.map((lead, index) => (
                <tr key={lead.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.leadDate ? format(new Date(lead.leadDate), 'MMM dd, yyyy') : ''}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lead.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.mobileNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.emailAddress}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.services.join(', ')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm min-w-[150px]">
                    <select
                      value={lead.leadStatus}
                      onChange={(e) => handleStatusChange(lead.id!, e.target.value)}
                      className={`block py-1 px-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent sm:text-sm ${getStatusColorClass(lead.leadStatus)}`}
                      style={{ backgroundColor: availableStatuses.find(s => s.name === lead.leadStatus)?.color || 'transparent' }}
                    >
                      {availableStatuses.map(status => (
                        <option key={status.id} value={status.name} style={{ backgroundColor: '#ffffff', color: '#000000' }}>{status.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={lead.notes}>{lead.notes || 'N/A'}</td>
                  
                  {/* *** MODIFIED CELL FOR INLINE DATE EDITING *** */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <input
                      type="date"
                      value={lead.lastFollowUpDate || ''}
                      onChange={(e) => handleFollowupDateChange(lead.id!, e.target.value)}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                    />
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => onEdit(lead)} className="text-accent hover:text-blue-900 mr-3" title="Edit Lead">
                      <Edit className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDelete(lead.id!)} className="text-red-600 hover:text-red-900" title="Delete Lead">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeadList;