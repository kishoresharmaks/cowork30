'use client';

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
  latitude?: number | null;
  longitude?: number | null;
  phone: string;
  email: string;
  openingTime: string;
  closingTime: string;
  isActive: boolean;
}

interface BranchContextType {
  branches: Branch[];
  activeBranch: Branch | null;
  isLoading: boolean;
  error: string | null;
  setActiveBranch: (branch: Branch) => void;
  refreshBranches: () => Promise<void>;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeBranch, setActiveBranchState] = useState<Branch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBranches = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get('/branches');
      const data: Branch[] = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];

      setBranches(data);

      if (data.length > 0) {
        // Read stored branch ID from localStorage
        const storedBranchId = typeof window !== 'undefined' ? localStorage.getItem('selected_branch_id') : null;
        let selected: Branch | undefined;

        if (storedBranchId) {
          selected = data.find((b) => b.id === Number(storedBranchId));
        }

        // Fallback to first branch if stored selection not found
        if (!selected) {
          selected = data[0];
        }

        setActiveBranchState(selected);
        if (typeof window !== 'undefined' && selected) {
          localStorage.setItem('selected_branch_id', String(selected.id));
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch branches:', err);
      setError('Unable to load branch locations.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const setActiveBranch = (branch: Branch) => {
    setActiveBranchState(branch);
    if (typeof window !== 'undefined') {
      localStorage.setItem('selected_branch_id', String(branch.id));
    }
  };

  return (
    <BranchContext.Provider
      value={{
        branches,
        activeBranch,
        isLoading,
        error,
        setActiveBranch,
        refreshBranches: fetchBranches,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
}
