import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { 
  Tenant, 
  UserProfile, 
  Subscription, 
  SubscriptionStatus, 
  SubscriptionPlan,
  SUBSCRIPTION_PLANS,
  Permission 
} from '../types';
import { 
  Building2, 
  Users, 
  CreditCard, 
  TrendingUp, 
  UserPlus,
  Calendar,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';

const SuperAdminDashboard: React.FC = () => {
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalTenants: 0,
    activeTenants: 0,
    trialTenants: 0,
    expiredTenants: 0,
    totalUsers: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    recentRegistrations: 0
  });
  const [recentTenants, setRecentTenants] = useState<Tenant[]>([]);
  const [recentSubscriptions, setRecentSubscriptions] = useState<Subscription[]>([]);

  useEffect(() => {
    if (hasPermission(Permission.VIEW_ALL_ANALYTICS)) {
      fetchAnalytics();
    }
  }, [hasPermission]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch tenants
      const tenantsSnapshot = await getDocs(collection(db, 'tenants'));
      const tenants = tenantsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Tenant[];
      
      // Fetch users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserProfile[];
      
      // Fetch subscriptions
      const subscriptionsSnapshot = await getDocs(collection(db, 'subscriptions'));
      const subscriptions = subscriptionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Subscription[];
      
      // Calculate analytics
      const activeTenants = tenants.filter(t => t.isActive).length;
      const trialTenants = subscriptions.filter(s => s.plan === SubscriptionPlan.TRIAL).length;
      const expiredTenants = subscriptions.filter(s => s.status === SubscriptionStatus.EXPIRED).length;
      
      const totalRevenue = subscriptions
        .filter(s => s.status === SubscriptionStatus.ACTIVE)
        .reduce((sum, s) => sum + s.amount, 0);
      
      const currentMonth = new Date().getMonth();
      const monthlyRevenue = subscriptions
        .filter(s => 
          s.status === SubscriptionStatus.ACTIVE && 
          s.startDate.toDate().getMonth() === currentMonth
        )
        .reduce((sum, s) => sum + s.amount, 0);
      
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      const recentRegistrations = tenants.filter(t => 
        t.createdAt.toDate() > lastWeek
      ).length;
      
      setAnalytics({
        totalTenants: tenants.length,
        activeTenants,
        trialTenants,
        expiredTenants,
        totalUsers: users.length,
        totalRevenue,
        monthlyRevenue,
        recentRegistrations
      });
      
      // Get recent tenants
      const recentTenantsQuery = query(
        collection(db, 'tenants'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const recentTenantsSnapshot = await getDocs(recentTenantsQuery);
      setRecentTenants(recentTenantsSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as Tenant[]);
      
      // Get recent subscriptions
      const recentSubscriptionsQuery = query(
        collection(db, 'subscriptions'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const recentSubscriptionsSnapshot = await getDocs(recentSubscriptionsQuery);
      setRecentSubscriptions(recentSubscriptionsSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as Subscription[]);
      
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: SubscriptionStatus) => {
    switch (status) {
      case SubscriptionStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case SubscriptionStatus.TRIAL:
        return 'bg-blue-100 text-blue-800';
      case SubscriptionStatus.EXPIRED:
        return 'bg-red-100 text-red-800';
      case SubscriptionStatus.SUSPENDED:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!hasPermission(Permission.VIEW_ALL_ANALYTICS)) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
        <p className="mt-1 text-sm text-gray-500">You don't have permission to view analytics.</p>
      </div>
    );
  }

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
        <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
        <p className="text-gray-600">Overview of all tenants and system analytics</p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Tenants</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalTenants}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Tenants</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.activeTenants}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Calendar className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Trial Tenants</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.trialTenants}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₹{analytics.totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₹{analytics.monthlyRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Expired Tenants</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.expiredTenants}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <UserPlus className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">New This Week</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.recentRegistrations}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tenants */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Tenants</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentTenants.map((tenant) => (
                <div key={tenant.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{tenant.name}</p>
                      <p className="text-xs text-gray-500">
                        {format(tenant.createdAt.toDate(), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    tenant.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {tenant.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Subscriptions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Subscriptions</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentSubscriptions.map((subscription) => (
                <div key={subscription.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {SUBSCRIPTION_PLANS[subscription.plan].name}
                      </p>
                      <p className="text-xs text-gray-500">
                        ₹{subscription.amount.toLocaleString()} • {format(subscription.createdAt.toDate(), 'MMM dd')}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(subscription.status)}`}>
                    {subscription.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;