import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { X, Send, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export const InputTransaksi = () => {
  const [action, setAction] = useState<'MASUK' | 'KELUAR'>('MASUK');
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [validItems, setValidItems] = useState<string[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<any[]>([]);
  const [activeShift, setActiveShift] = useState<any>(null);
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [showSendDialog, setShowSendDialog] = useState(false);
  const { user, userRole } = useAuth();
  const { toast } = useToast();

  const fetchData = async () => {
    // Fetch valid items
    const { data: items } = await supabase
      .from('valid_items')
      .select('name')
      .order('name');
    
    if (items) {
      setValidItems(items.map(i => i.name));
    }

    // Fetch active shift
    const { data: shift } = await supabase
      .from('active_shift')
      .select('*')
      .limit(1)
      .maybeSingle();
    
    setActiveShift(shift);

    // Fetch pending transactions for active shift
    if (shift) {
      const { data: pending } = await supabase
        .from('inventory_transactions')
        .select('*')
        .eq('status', 'pending')
        .eq('shift', shift.shift_name)
        .order('timestamp', { ascending: false });
      
      if (pending) {
        setPendingTransactions(pending);
      }
    }
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('inventory-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory_transactions'
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeShift || !user) {
      toast({
        title: 'Error',
        description: 'Tidak ada shift aktif',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('inventory_transactions')
        .insert({
          action,
          item_name: itemName.toUpperCase(),
          quantity,
          shift: activeShift.shift_name,
          status: 'pending',
          created_by: user.id,
        });

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Transaksi ditambahkan ke daftar pending',
      });

      setItemName('');
      setQuantity(1);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeletePending = async (id: string) => {
    try {
      const { error } = await supabase
        .from('inventory_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Transaksi dihapus',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSendUpdate = async () => {
    if (!activeShift || pendingTransactions.length === 0) return;

    try {
      const ids = pendingTransactions.map(t => t.id);
      
      const { error } = await supabase
        .from('inventory_transactions')
        .update({ status: 'processed' })
        .in('id', ids);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: `${ids.length} transaksi telah diproses`,
      });

      setShowSendDialog(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleAddItem = async () => {
    if (!user || !newItemName.trim()) return;

    try {
      const { error } = await supabase
        .from('valid_items')
        .insert({
          name: newItemName.toUpperCase(),
          created_by: user.id,
        });

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Item baru ditambahkan',
      });

      setNewItemName('');
      setShowAddItemDialog(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (!activeShift) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Mulai shift terlebih dahulu untuk input transaksi
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Formulir Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Aksi</Label>
              <RadioGroup value={action} onValueChange={(v: any) => setAction(v)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="MASUK" id="masuk" />
                  <Label htmlFor="masuk" className="font-normal cursor-pointer">
                    MASUK
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="KELUAR" id="keluar" />
                  <Label htmlFor="keluar" className="font-normal cursor-pointer">
                    KELUAR
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="item">Nama Barang</Label>
                {userRole === 'admin' && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddItemDialog(true)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Item Baru
                  </Button>
                )}
              </div>
              <Input
                id="item"
                list="items"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Pilih atau ketik nama barang"
                required
              />
              <datalist id="items">
                {validItems.map(item => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Jumlah</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                required
              />
            </div>

            <Button type="submit" className="w-full">
              Tambah ke Pending
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Siap Dikirim ({pendingTransactions.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingTransactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Belum ada transaksi pending
            </p>
          ) : (
            <>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {pendingTransactions.map(t => (
                  <div
                    key={t.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      t.action === 'MASUK' ? 'bg-success-light border-success' : 'bg-destructive-light border-destructive'
                    }`}
                  >
                    <div>
                      <p className="font-medium">{t.item_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {t.action} - {t.quantity} unit
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeletePending(t.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                className="w-full"
                onClick={() => setShowSendDialog(true)}
                disabled={pendingTransactions.length === 0}
              >
                <Send className="h-4 w-4 mr-2" />
                Kirim & Update
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Item Baru</DialogTitle>
            <DialogDescription>
              Tambahkan item inventaris baru ke daftar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-item">Nama Item</Label>
              <Input
                id="new-item"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="NAMA ITEM (huruf besar)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddItemDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleAddItem}>
              Tambah
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Pengiriman</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin memproses {pendingTransactions.length} transaksi?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleSendUpdate}>
              Ya, Kirim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};