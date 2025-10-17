import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Clock, Play, Square } from 'lucide-react';
import { format } from 'date-fns';

export const ShiftManager = () => {
  const [activeShift, setActiveShift] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [selectedShift, setSelectedShift] = useState<'PAGI' | 'SORE' | 'DH'>('PAGI');
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchActiveShift = async () => {
    try {
      const { data, error } = await supabase
        .from('active_shift')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setActiveShift(data);
    } catch (error) {
      console.error('Error fetching active shift:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveShift();

    const channel = supabase
      .channel('active-shift-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'active_shift'
        },
        () => {
          fetchActiveShift();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleStartShift = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('active_shift')
        .insert({
          shift_name: selectedShift,
          started_by: user.id,
        });

      if (error) throw error;

      toast({
        title: 'Shift Dimulai',
        description: `Shift ${selectedShift} telah dimulai.`,
      });

      setShowStartDialog(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEndShift = async () => {
    if (!activeShift || !user) return;

    try {
      // Fetch all valid items
      const { data: validItems } = await supabase
        .from('valid_items')
        .select('name');

      if (!validItems) throw new Error('Failed to fetch valid items');

      // Calculate final stock for all items
      const snapshotData: Record<string, number> = {};

      for (const item of validItems) {
        const itemName = item.name;

        // Get previous shift snapshot
        const previousShiftInfo = getPreviousShiftInfo(
          new Date(),
          activeShift.shift_name
        );

        let stockAwal = 0;
        if (previousShiftInfo) {
          const { data: prevSnapshot } = await supabase
            .from('inventory_snapshots')
            .select('snapshot_data')
            .eq('id', `${previousShiftInfo.date}_${previousShiftInfo.shift}`)
            .maybeSingle();

          if (prevSnapshot?.snapshot_data) {
            stockAwal = prevSnapshot.snapshot_data[itemName] || 0;
          }
        }

        // Get transactions for current shift
        const { data: transactions } = await supabase
          .from('inventory_transactions')
          .select('action, quantity')
          .eq('item_name', itemName)
          .eq('shift', activeShift.shift_name)
          .eq('status', 'processed')
          .gte('timestamp', activeShift.started_at);

        let masuk = 0;
        let keluar = 0;

        transactions?.forEach(t => {
          if (t.action === 'MASUK') {
            masuk += t.quantity;
          } else {
            keluar += t.quantity;
          }
        });

        snapshotData[itemName] = stockAwal + masuk - keluar;
      }

      // Save snapshot
      const shiftDate = format(new Date(), 'yyyy-MM-dd');
      const { error: snapshotError } = await supabase
        .from('inventory_snapshots')
        .insert({
          id: `${shiftDate}_${activeShift.shift_name}`,
          shift_date: shiftDate,
          shift_name: activeShift.shift_name,
          snapshot_data: snapshotData,
          created_by: user.id,
        });

      if (snapshotError) throw snapshotError;

      // Delete active shift
      const { error: deleteError } = await supabase
        .from('active_shift')
        .delete()
        .eq('id', activeShift.id);

      if (deleteError) throw deleteError;

      toast({
        title: 'Shift Berakhir',
        description: `Shift ${activeShift.shift_name} telah berakhir dan snapshot telah disimpan.`,
      });

      setShowEndDialog(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getPreviousShiftInfo = (currentDate: Date, currentShift: string) => {
    const shifts = ['PAGI', 'SORE', 'DH'];
    const currentShiftIndex = shifts.indexOf(currentShift);

    if (currentShiftIndex === 0) {
      const prevDate = new Date(currentDate);
      prevDate.setDate(prevDate.getDate() - 1);
      return {
        date: format(prevDate, 'yyyy-MM-dd'),
        shift: 'DH',
      };
    } else {
      return {
        date: format(currentDate, 'yyyy-MM-dd'),
        shift: shifts[currentShiftIndex - 1],
      };
    }
  };

  if (loading) {
    return null;
  }

  if (!activeShift) {
    return (
      <>
        <Card className="bg-warning-light border-warning">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Tidak Ada Shift Aktif
            </CardTitle>
            <CardDescription>
              Anda harus memulai shift terlebih dahulu untuk menggunakan modul inventaris.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowStartDialog(true)}>
              <Play className="h-4 w-4 mr-2" />
              Mulai Shift Baru
            </Button>
          </CardContent>
        </Card>

        <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mulai Shift Baru</DialogTitle>
              <DialogDescription>
                Pilih shift yang akan dimulai
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Select value={selectedShift} onValueChange={(v: any) => setSelectedShift(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAGI">PAGI</SelectItem>
                  <SelectItem value="SORE">SORE</SelectItem>
                  <SelectItem value="DH">DH</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowStartDialog(false)}>
                Batal
              </Button>
              <Button onClick={handleStartShift}>
                Mulai Shift
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Card className="bg-success-light border-success">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Shift Aktif: {activeShift.shift_name}
          </CardTitle>
          <CardDescription>
            Dimulai pada {format(new Date(activeShift.started_at), 'dd MMM yyyy HH:mm')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setShowEndDialog(true)}>
            <Square className="h-4 w-4 mr-2" />
            Akhiri Shift
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Akhiri Shift</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin mengakhiri shift {activeShift.shift_name}? Snapshot stok akan dibuat secara otomatis.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndDialog(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleEndShift}>
              Akhiri Shift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};