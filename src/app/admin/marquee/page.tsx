
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Annoyed, PlusCircle, Edit, Trash2, Info } from 'lucide-react';
import { CONFIG } from '@/lib/constants';
import type { MarqueeItem } from '@/types';
// import { db } from '@/lib/firebase'; // Uncomment when moving to Firestore
// import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore'; // Uncomment for Firestore
import { useToast } from '@/hooks/use-toast';

// const MARQUEE_COLLECTION = 'marquee_messages'; // Firestore collection name

export default function AdminMarqueePage() {
  // When moving to Firestore, uncomment state and Firestore logic
  // const [marqueeItems, setMarqueeItems] = useState<MarqueeItem[]>([]);
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null);
  const [newItemText, setNewItemText] = useState('');
  // const [editingItem, setEditingItem] = useState<MarqueeItem | null>(null);
  const { toast } = useToast();

  // For now, display hardcoded items
  const [marqueeItems, _setMarqueeItems] = useState<MarqueeItem[]>(CONFIG.DEFAULT_MARQUEE_ITEMS.map(text => ({ text })));
  const [loading, _setLoading] = useState(false); // Simulate no loading for hardcoded data


  // useEffect(() => { // Uncomment when moving to Firestore
  //   fetchMarqueeItems();
  // }, []);

  // const fetchMarqueeItems = async () => { // Uncomment for Firestore
  //   setLoading(true);
  //   setError(null);
  //   try {
  //     const q = query(collection(db, MARQUEE_COLLECTION), orderBy('createdAt', 'asc')); // Assuming a 'createdAt' field for ordering
  //     const querySnapshot = await getDocs(q);
  //     const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MarqueeItem)); // Assuming 'id' and 'text' fields
  //     setMarqueeItems(items);
  //   } catch (err: any) {
  //     setError(`Failed to fetch marquee items: ${err.message}`);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleAddItem = async () => { // Update for Firestore
    if (!newItemText.trim()) {
      toast({ title: "Error", description: "Marquee text cannot be empty.", variant: "destructive" });
      return;
    }
    // setLoading(true);
    // try {
    //   await addDoc(collection(db, MARQUEE_COLLECTION), { text: newItemText.trim(), createdAt: serverTimestamp() });
    //   setNewItemText('');
    //   fetchMarqueeItems();
    //   toast({ title: "Success", description: "Marquee item added." });
    // } catch (err: any) {
    //   toast({ title: "Error", description: `Failed to add item: ${err.message}`, variant: "destructive" });
    // } finally {
    //   setLoading(false);
    // }
    alert("Adding item (simulated). Firestore integration needed.");
    setNewItemText('');
  };

  // const handleEditItem = (item: MarqueeItem) => { // Uncomment for Firestore
  //   setEditingItem(item);
  //   setNewItemText(item.text); // Populate input for editing
  // };

  // const handleUpdateItem = async () => { // Uncomment for Firestore
  //   if (!editingItem || !newItemText.trim()) return;
  //   setLoading(true);
  //   try {
  //     const itemRef = doc(db, MARQUEE_COLLECTION, editingItem.id!);
  //     await updateDoc(itemRef, { text: newItemText.trim() });
  //     setNewItemText('');
  //     setEditingItem(null);
  //     fetchMarqueeItems();
  //     toast({ title: "Success", description: "Marquee item updated." });
  //   } catch (err: any) {
  //     toast({ title: "Error", description: `Failed to update item: ${err.message}`, variant: "destructive" });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const handleDeleteItem = async (itemId: string) => { // Uncomment for Firestore
  //   if (!confirm("Are you sure you want to delete this marquee item?")) return;
  //   setLoading(true);
  //   try {
  //     await deleteDoc(doc(db, MARQUEE_COLLECTION, itemId));
  //     fetchMarqueeItems();
  //     toast({ title: "Success", description: "Marquee item deleted." });
  //   } catch (err: any) {
  //     toast({ title: "Error", description: `Failed to delete item: ${err.message}`, variant: "destructive" });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  if (loading && marqueeItems.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  // if (error) { // Uncomment for Firestore
  //   return (
  //     <Card className="border-destructive bg-destructive/10">
  //       <CardHeader><CardTitle className="text-destructive">Error</CardTitle></CardHeader>
  //       <CardContent><p>{error}</p></CardContent>
  //     </Card>
  //   );
  // }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight text-primary">Marquee Message Management</h2>
      
      <Card className="shadow-md rounded-xl border-border bg-blue-50 border-blue-200">
        <CardHeader>
            <CardTitle className="flex items-center text-blue-700"><Info className="mr-2 h-5 w-5"/>Important Note</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-blue-600">
                Currently, marquee messages are hardcoded in the application configuration.
                To enable full management (add, edit, delete) from this admin panel,
                the messages need to be stored in Firestore and the application logic
                (specifically in `AppStateProvider`) updated to fetch them from there.
            </p>
            <p className="text-sm text-blue-600 mt-2">
                The list below shows the current hardcoded messages for reference.
                The "Add New Item" form is a placeholder for future Firestore integration.
            </p>
        </CardContent>
      </Card>

      <Card className="shadow-md rounded-xl border-border">
        <CardHeader>
          <CardTitle className="flex items-center"><Annoyed className="mr-2 h-5 w-5 text-primary"/>Current Marquee Items</CardTitle>
          <CardDescription>List of messages currently displayed in the app's marquee.</CardDescription>
        </CardHeader>
        <CardContent>
          {marqueeItems.length === 0 ? (
            <p className="text-muted-foreground">No marquee items configured.</p>
          ) : (
            <ul className="space-y-2">
              {marqueeItems.map((item, index) => (
                <li key={index} className="flex justify-between items-center p-2 border rounded-md bg-muted/50">
                  <span className="text-sm">{item.text}</span>
                  {/* Placeholder for future edit/delete actions when using Firestore 
                  <div className="space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => alert('Edit: Firestore needed')} disabled>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => alert('Delete: Firestore needed')} disabled>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  */}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-md rounded-xl border-border">
        <CardHeader>
          <CardTitle className="flex items-center"><PlusCircle className="mr-2 h-5 w-5 text-primary"/>Add New Marquee Item (Placeholder)</CardTitle>
          <CardDescription>This form is a placeholder. Functionality requires Firestore integration.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="newItemText">New Item Text</Label>
            <Input 
              id="newItemText" 
              value={newItemText} 
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder="Enter new marquee message"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleAddItem} disabled={loading}>
            {/* {editingItem ? 'Update Item' : 'Add Item'} */}
            Add Item (Simulated)
          </Button>
          {/* {editingItem && (
            <Button variant="outline" onClick={() => { setEditingItem(null); setNewItemText(''); }} className="ml-2">
              Cancel Edit
            </Button>
          )} */}
        </CardFooter>
      </Card>
    </div>
  );
}
