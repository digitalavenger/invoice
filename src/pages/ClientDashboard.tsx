import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { Lead, StatusOption } from '../types';
import { format } from 'date-fns';
import { TrendingUp, Users, Calendar, CheckCircle } from 'lucide-react';

const ClientDashboard: React.FC = () => {
  const { currentUser, currentTenant } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableStatuses, setAvailableStatuses] = useState<StatusOption[]>([]);
  const [analytics, setAnalytics] = useState({
    totalLeads: 0,
    newLeads: 0,
    followupLeads: 0,
    convertedLeads: 0
  });

  useEffect(() => {
    if (currentUser?.uid && currentTenant?.id) {
      fetchLeads();
      fetchAvailableStatuses();
    }
  }, [currentUser, currentTenant]);

  const fetchLeads = async () => {
    if (!currentTenant?.id) return;
    
    setLoading(true);
    try {
      // Fetch leads for this tenant
      const leadsRef = collection(db, 'leads');
      const q = query(leadsRef, where('tenantId', '==', currentTenant.id));
      const querySnapshot = await getDocs(q);
      
      const leadsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Lead[];

      // Sort by creation date (newest first)
      leadsList.sort((a, b) => new Date(b.createdAt.toDate()).getTime() - new Date(a.createdAt.toDate()).getTime());

      setLeads(leadsList);
      calculateAnalytics(leadsList);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableStatuses = async () => {
    if (!currentTenant?.id) return;
    
    try {
      const statusesRef = collection(db, 'status_options');
      const q = query(statusesRef, where('tenantId', '==', currentTenant.id));
      const querySnapshot = await getDocs(q);
      const statusesList = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as StatusOption[];
      setAvailableStatuses(statusesList);
    } catch (error) {
      console.error('Error fetching available statuses:', error);
      // Fallback to default statuses
      setAvailableStatuses([
        { id: 'default_created', name: 'Created', order: 1, isDefault: true, color: '#2563EB', tenantId: currentTenant?.id || '', createdAt: new Date() as any, updatedAt: new Date() as any },
        { id: 'default_followup', name: 'Followup', order: 2, color: '#FBBF24', tenantId: currentTenant?.id || '', createdAt: new Date() as any, updatedAt: new Date() as any },
        { id: 'default_client', name: 'Client', order: 3, color: '#10B981', tenantId: currentTenant?.id || '', createdAt: new Date() as any, updatedAt: new Date() as any },
        { id: 'default_rejected', name: 'Rejected', order: 4, color: '#EF4444', tenantId: currentTenant?.id || '', createdAt: new Date() as any, updatedAt: new Date() as any },
      ]);
    }
  };

  const calculateAnalytics = (leadsList: Lead[]) => {
    const totalLeads = leadsList.length;
    const newLeads = leadsList.filter(lead => lead.leadStatus === 'Created').length;
    const followupLeads = leadsList.filter(lead => lead.leadStatus === 'Followup').length;
    const convertedLeads = leadsList.filter(lead => lead.leadStatus === 'Client').length;

    setAnalytics({
      totalLeads,
      newLeads,
      followupLeads,
      convertedLeads
    });
  };

  const handleStatusUpdate = async (leadId: string, newStatus: string) => {
    if (!currentTenant?.id) return;
    
    try {
      await updateDoc(doc(db, 'leads', leadId), {
        leadStatus: newStatus,
        updatedAt: new Date()
      });
      
      // Update local state
      setLeads(prev => prev.map(lead => 
        lead.id === leadId ? { ...lead, leadStatus: newStatus } : lead
      ));
      
      // Recalculate analytics
      const updatedLeads = leads.map(lead => 
        lead.id === leadId ? { ...lead, leadStatus: newStatus } : lead
      );
      calculateAnalytics(updatedLeads);
    } catch (error) {
      console.error('Error updating lead status:', error);
    }
  };

  const getStatusColor = (statusName: string) => {
    const status = availableStatuses.find(s => s.name === statusName);
    return status?.color || '#9E9E9E';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Client Dashboard</h1>
        <p className="text-gray-600">Overview of your leads and performance</p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Leads</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalLeads}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Calendar className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">New Leads</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.newLeads}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Follow-up</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.followupLeads}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Converted</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.convertedLeads}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-4 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Your Leads</h3>
        </div>
        {leads.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No leads found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Services</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leads.map((lead, index) => (
                  <tr key={lead.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {lead.leadDate ? format(new Date(lead.leadDate), 'MMM dd, yyyy') : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{lead.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lead.mobileNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lead.emailAddress}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lead.services.join(', ')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <select
                        value={lead.leadStatus}
                        onChange={(e) => handleStatusUpdate(lead.id!, e.target.value)}
                        className="block py-1 px-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent sm:text-sm text-white"
                        style={{ backgroundColor: getStatusColor(lead.leadStatus) }}
                      >
                        {availableStatuses.map(status => (
                          <option key={status.id} value={status.name} style={{ backgroundColor: '#ffffff', color: '#000000' }}>
                            {status.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={lead.notes}>
                      {lead.notes || 'N/A'}
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

export default ClientDashboard;