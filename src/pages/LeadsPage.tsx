// Path: digitalavenger/invoice/invoice-8778080b2e82e01b0e0b1db4cbffc77385999a44/src/pages/LeadsPage.tsx

import React, { useState } from 'react';
import LeadList from '../components/Lead/LeadList';
import LeadForm from '../components/Lead/LeadForm';
import { Lead } from '../types';

const LeadsPage: React.FC = () => {
  const [editingLead, setEditingLead] = useState<Lead | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);

  const handleNewLead = () => {
    setEditingLead(undefined);
    setShowForm(true);
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setShowForm(true);
  };

  const handleSaveSuccess = () => {
    setShowForm(false);
    setEditingLead(undefined);
    // A simple way to trigger re-fetch in LeadList (assuming it fetches on mount/props change)
    // For a more robust solution, consider context API or state management for lead list refresh
    window.location.reload(); // Simple reload to refresh list for now
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingLead(undefined);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {showForm ? (
        <LeadForm lead={editingLead} onSave={handleSaveSuccess} onCancel={handleCancel} />
      ) : (
        <LeadList onEdit={handleEditLead} onNew={handleNewLead} />
      )}
    </div>
  );
};

export default LeadsPage;