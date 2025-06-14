
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Annoyed, PlusCircle, Edit, Trash2, Info, AlertTriangle, RefreshCw } from 'lucide-react';
import type { MarqueeItem } from '@/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const MARQUEE_COLLECTION = 'marquee_items';
const cardStyle = "rounded-xl shadow-md border border-border/60 hover:border-primary/40 hover:shadow-primary/10 transition-all duration-300";

interface MarqueeItemForAdmin extends Omit<MarqueeItem, 'createdAt'> {
  id: string;
  createdAt?: Date | null; 
}

export default function AdminMarqueePage() {
  const [marqueeItems, setMarqueeItems] = useState<MarqueeItemForAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newItemText, setNewItemText] = useState('');
  const [editingItem, setEditingItem] = useState<MarqueeItemForAdmin | null>(null);
  const { toast } = useToast();

  const fetchMarqueeItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, MARQUEE_COLLECTION), orderBy('createdAt', 'asc'));
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          text: data.text,
          createdAt: (data.createdAt as Timestamp)?.toDate() || null,
        } as MarqueeItemForAdmin;
      });
      setMarqueeItems(items);
    } catch (err: any) {
      console.error("Error fetching marquee items:", err);
      setError(`Failed to fetch marquee items: ${err.message}. Check Firestore rules and indexes for '${MARQUEE_COLLECTION}' on 'createdAt' (asc).`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarqueeItems();
  }, [fetchMarqueeItems]);

  const handleAddItem = async () => {
    if (!newItemText.trim()) {
      toast({ title: "Error", description: "Marquee text cannot be empty.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, MARQUEE_COLLECTION), { 
        text: newItemText.trim(), 
        createdAt: serverTimestamp() 
      });
      setNewItemText('');
      fetchMarqueeItems();
      toast({ title: "Success", description: "Marquee item added." });
    } catch (err: any) {
      toast({ title: "Error", description: `Failed to add item: ${err.message}`, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleEditItem = (item: MarqueeItemForAdmin) => {
    setEditingItem(item);
    setNewItemText(item.text);
  };

  const handleUpdateItem = async () => {
    if (!editingItem || !newItemText.trim()) return;
    setLoading(true);
    try {
      const itemRef = doc(db, MARQUEE_COLLECTION, editingItem.id!);
      await updateDoc(itemRef, { 
        text: newItemText.trim(),
        updatedAt: serverTimestamp() 
      });
      setNewItemText('');
      setEditingItem(null);
      fetchMarqueeItems();
      toast({ title: "Success", description: "Marquee item updated." });
    } catch (err: any) {
      toast({ title: "Error", description: `Failed to update item: ${err.message}`, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this marquee item?")) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, MARQUEE_COLLECTION, itemId));
      fetchMarqueeItems();
      toast({ title: "Success", description: "Marquee item deleted." });
    } catch (err: any) {
      toast({ title: "Error", description: `Failed to delete item: ${err.message}`, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-6 p-4">
         <div className="flex items-center justify-between">
           <h2 className="text-3xl font-bold tracking-tight text-foreground">Marquee Management</h2>
            <Button onClick={fetchMarqueeItems} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Retry
            </Button>
        </div>
        <Card className="border-destructive bg-destructive/10 rounded-xl shadow-md">
          <CardHeader><CardTitle className="flex items-center text-destructive"><AlertTriangle className="mr-2 h-5 w-5"/>Error</CardTitle></CardHeader>
          <CardContent><p className="text-destructive">{error}</p></CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Marquee Message Management</h2>
        <Button onClick={fetchMarqueeItems} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>
      
      <Card className={cardStyle}>
        <CardHeader>
          <CardTitle className="flex items-center text-xl"><Annoyed className="mr-2 h-5 w-5 text-primary"/>Current Marquee Items</CardTitle>
          <CardDescription>List of messages currently displayed in the app's marquee.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && marqueeItems.length === 0 ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-md" />)}
            </div>
          ) : marqueeItems.length === 0 ? (
            <p className="text-muted-foreground">No marquee items found in Firestore.</p>
          ) : (
            <ul className="space-y-2">
              {marqueeItems.map((item) => (
                <li key={item.id} className="flex justify-between items-center p-3 border border-border/50 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <span className="text-sm flex-grow mr-2">{item.text}</span>
                  <div className="space-x-2 flex-shrink-0">
                    <Button variant="outline" size="icon" onClick={() => handleEditItem(item)} className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteItem(item.id)} className="h-8 w-8">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className={cardStyle}>
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <PlusCircle className="mr-2 h-5 w-5 text-primary"/>
            {editingItem ? 'Edit Marquee Item' : 'Add New Marquee Item'}
          </CardTitle>
          <CardDescription>
            {editingItem ? `Editing item ID: ${editingItem.id}` : 'Create a new message for the marquee.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="itemText" className="text-xs font-medium text-muted-foreground">Item Text</Label>
            <Input 
              id="itemText" 
              value={newItemText} 
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder="Enter marquee message"
              className="text-sm"
            />
          </div>
        </CardContent>
        <CardFooter className="gap-2">
          <Button onClick={editingItem ? handleUpdateItem : handleAddItem} disabled={loading || !newItemText.trim()} size="sm">
            {editingItem ? 'Update Item' : 'Add Item'}
          </Button>
          {editingItem && (
            <Button variant="outline" size="sm" onClick={() => { setEditingItem(null); setNewItemText(''); }} disabled={loading}>
              Cancel Edit
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
