'use client';

import {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';

export type CartItem = {
  key: string;
  productId: number;
  name: string;
  image: string;
  price: number;
  quantity: number;
  options: Record<string, string>;
  sku?: string;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  open: boolean;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  setQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  setOpen: (open: boolean) => void;
};

const STORAGE_KEY = '7phone-cart-v1';
const CartContext = createContext<CartContextValue | null>(null);

function validItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is CartItem => Boolean(
    item && typeof item === 'object' && typeof item.key === 'string'
    && typeof item.productId === 'number' && typeof item.name === 'string'
    && typeof item.price === 'number' && Number.isFinite(item.price)
    && typeof item.quantity === 'number' && item.quantity > 0
  ));
}

export function CartProvider({children}: {children: React.ReactNode}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setItems(validItems(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')));
    } catch {
      setItems([]);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>) => {
    setItems((current) => {
      const existing = current.find((row) => row.key === item.key);
      return existing
        ? current.map((row) => row.key === item.key ? {...row, quantity: row.quantity + 1, price: item.price, name: item.name, image: item.image, options: item.options} : row)
        : [...current, {...item, quantity: 1}];
    });
    setOpen(true);
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    setItems((current) => quantity < 1 ? current.filter((item) => item.key !== key) : current.map((item) => item.key === key ? {...item, quantity} : item));
  }, []);
  const removeItem = useCallback((key: string) => setItems((current) => current.filter((item) => item.key !== key)), []);
  const count = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const value = useMemo(() => ({items, count, open, addItem, setQuantity, removeItem, setOpen}), [items, count, open, addItem, setQuantity, removeItem]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart must be used inside CartProvider');
  return value;
}
