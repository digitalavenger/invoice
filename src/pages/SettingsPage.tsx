// Path: digitalavenger/invoice/invoice-8778080b2e82e01b0e0b1db4cbffc77385999a44/src/pages/SettingsPage.tsx

import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { CompanySettings } from '../types';
import { Save, Upload, Building } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<CompanySettings>({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    gst: '',
    pan: '',
    logoUrl: '',
    logoBase64: '', // Initialize new field
    invoicePrefix: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const settingsRef = collection(db, `users/${currentUser?.uid}/settings`);
      const querySnapshot = await getDocs(settingsRef);
      if (!querySnapshot.empty) {
        const settings = querySnapshot.docs[0].data() as CompanySettings;
        setFormData(settings);
        setSettingsId(querySnapshot.docs[0].id);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  // Function to convert File to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleLogoUpload = async (file: File): Promise<{ url: string, base64: string }> => {
    const logoRef = ref(storage, `logos/${currentUser?.uid}/${file.name}`);
    await uploadBytes(logoRef, file);
    const url = await getDownloadURL(logoRef);
    const base64 = await fileToBase64(file); // Convert to Base64
    return { url, base64 };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let logoUrl = formData.logoUrl;
      let logoBase64 = formData.logoBase64; // Get existing Base64

      if (logoFile) {
        const result = await handleLogoUpload(logoFile);
        logoUrl = result.url;
        logoBase64 = result.base64; // Set new Base64
      }

      const settingsData = {
        ...formData,
        logoUrl,
        logoBase64 // Save Base64 to Firebase
      };

      if (!currentUser?.uid) { // Ensure user is logged in
        console.error("Error saving settings: User not logged in (UID is null).");
        alert('Error saving settings: You must be logged in.');
        setLoading(false);
        return;
      }

      if (settingsId) {
        await updateDoc(doc(db, `users/${currentUser.uid}/settings`, settingsId), settingsData);
      } else {
        const docRef = await addDoc(collection(db, `users/${currentUser.uid}/settings`), settingsData);
        setSettingsId(docRef.id);
      }

      setFormData({ ...settingsData });
      setLogoFile(null);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Detailed Error saving settings:', error); // Log the actual error
      alert(`Error saving settings: ${error.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Building className="w-6 h-6 mr-2" />
            Company Settings
          </h1>
          <p className="text-gray-600 mt-1">Configure your company information for invoices</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Logo
            </label>
            <div className="flex items-center space-x-4">
              {/* Display logo from logoUrl or logoBase64 if available */}
              {(formData.logoUrl || formData.logoBase64) && (
                <img
                  src={formData.logoUrl || formData.logoBase64}
                  alt="Company Logo"
                  className="h-16 w-16 object-contain border border-gray-200 rounded"
                />
              )}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Logo
                </label>
                {logoFile && (
                  <p className="text-sm text-gray-500 mt-1">
                    Selected: {logoFile.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone *
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GST Number *
              </label>
              <input
                type="text"
                required
                value={formData.gst}
                onChange={(e) => setFormData({ ...formData, gst: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PAN Number *
              </label>
              <input
                type="text"
                required
                value={formData.pan}
                onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {/* Invoice Prefix field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Prefix (e.g., VRI)
              </label>
              <input
                type="text"
                value={formData.invoicePrefix || ''}
                onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                maxLength={5}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address *
            </label>
            <textarea
              required
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Bank Account Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Bank Account Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={formData.bankName || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  value={formData.accountNumber || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IFSC Code
                </label>
                <input
                  type="text"
                  value={formData.ifscCode || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, ifscCode: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branch Name
                </label>
                <input
                  type="text"
                  value={formData.branchName || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, branchName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>


          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;