import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

export const useTenantData = <T extends { id?: string; tenantId?: string; userId?: string }>(
  collectionName: string
) => {
  const { currentUser, userProfile, currentTenant } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const getCollectionPath = () => {
    if (currentTenant) {
      return `tenants/${currentTenant.id}/${collectionName}`;
    }
    return `users/${currentUser?.uid}/${collectionName}`;
  };

  const fetchData = async () => {
    if (!currentUser?.uid) return;
    
    setLoading(true);
    try {
      const collectionRef = collection(db, getCollectionPath());
      let q = query(collectionRef);
      
      // If user has a tenant, filter by tenant
      if (currentTenant) {
        q = query(collectionRef, where('tenantId', '==', currentTenant.id));
      }
      
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
      
      setData(items);
    } catch (error) {
      console.error(`Error fetching ${collectionName}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (item: Omit<T, 'id'>) => {
    if (!currentUser?.uid) return;
    
    try {
      const itemWithMeta = {
        ...item,
        userId: currentUser.uid,
        tenantId: currentTenant?.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const docRef = await addDoc(collection(db, getCollectionPath()), itemWithMeta);
      const newItem = { id: docRef.id, ...itemWithMeta } as T;
      setData(prev => [...prev, newItem]);
      return newItem;
    } catch (error) {
      console.error(`Error adding ${collectionName} item:`, error);
      throw error;
    }
  };

  const updateItem = async (id: string, updates: Partial<T>) => {
    if (!currentUser?.uid) return;
    
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };
      
      await updateDoc(doc(db, getCollectionPath(), id), updateData);
      setData(prev => prev.map(item => 
        item.id === id ? { ...item, ...updateData } : item
      ));
    } catch (error) {
      console.error(`Error updating ${collectionName} item:`, error);
      throw error;
    }
  };

  const deleteItem = async (id: string) => {
    if (!currentUser?.uid) return;
    
    try {
      await deleteDoc(doc(db, getCollectionPath(), id));
      setData(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error(`Error deleting ${collectionName} item:`, error);
      throw error;
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser, currentTenant]);

  return {
    data,
    loading,
    addItem,
    updateItem,
    deleteItem,
    refetch: fetchData
  };
};