import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export interface Branch {
  id: number;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  openingTime: string;
  closingTime: string;
}

interface BranchContextType {
  branches: Branch[];
  activeBranch: Branch | null;
  setActiveBranch: (branch: Branch) => void;
  loading: boolean;
}

const BranchContext = createContext<BranchContextType>({
  branches: [],
  activeBranch: null,
  setActiveBranch: () => {},
  loading: true,
});

export const BranchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeBranch, setActiveBranchState] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/branches')
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setBranches(data);
        if (data.length > 0) {
          const savedBranchId = localStorage.getItem('active_branch_id');
          const found = data.find((b: Branch) => b.id.toString() === savedBranchId);
          setActiveBranchState(found || data[0]);
        }
      })
      .catch((err) => console.error('Failed to load branches:', err))
      .finally(() => setLoading(false));
  }, []);

  const setActiveBranch = (branch: Branch) => {
    setActiveBranchState(branch);
    localStorage.setItem('active_branch_id', branch.id.toString());
  };

  return (
    <BranchContext.Provider value={{ branches, activeBranch, setActiveBranch, loading }}>
      {children}
    </BranchContext.Provider>
  );
};

export const useBranch = () => useContext(BranchContext);
