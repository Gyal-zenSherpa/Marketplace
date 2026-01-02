import React, { createContext, useContext, useState, ReactNode } from "react";
import { Product } from "@/types/product";
import { toast } from "@/hooks/use-toast";

interface CompareContextType {
  compareItems: Product[];
  addToCompare: (product: Product) => void;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
  isInCompare: (productId: string) => boolean;
  isCompareOpen: boolean;
  setIsCompareOpen: (open: boolean) => void;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [compareItems, setCompareItems] = useState<Product[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  const addToCompare = (product: Product) => {
    if (compareItems.length >= 3) {
      toast({
        title: "Compare limit reached",
        description: "You can compare up to 3 products at a time. Remove one to add another.",
        duration: 3000,
      });
      return;
    }

    if (compareItems.some((item) => item.id === product.id)) {
      toast({
        title: "Already in compare",
        description: `${product.name} is already in your comparison list.`,
        duration: 2000,
      });
      return;
    }

    setCompareItems((prev) => [...prev, product]);
    toast({
      title: "Added to compare",
      description: `${product.name} added to comparison.`,
      duration: 2000,
    });
  };

  const removeFromCompare = (productId: string) => {
    setCompareItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const clearCompare = () => {
    setCompareItems([]);
  };

  const isInCompare = (productId: string) => {
    return compareItems.some((item) => item.id === productId);
  };

  return (
    <CompareContext.Provider
      value={{
        compareItems,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
        isCompareOpen,
        setIsCompareOpen,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error("useCompare must be used within a CompareProvider");
  }
  return context;
}
