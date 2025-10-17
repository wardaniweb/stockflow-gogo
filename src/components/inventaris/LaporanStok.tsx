import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { FileText } from 'lucide-react';
import { format } from 'date-fns';

interface StockReport {
  item_name: string;
  stock_awal: number;
  masuk: number;
  keluar: number;
  sisa_akhir: number;
}

export const LaporanStok = () => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedShift, setSelectedShift] = useState<'PAGI' | 'SORE' | 'DH'>('PAGI');
  const [report, setReport] = useState<StockReport[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getPreviousShiftInfo = (dateStr: string, shift: string) => {
    const shifts = ['PAGI', 'SORE', 'DH'];
    const currentShiftIndex = shifts.indexOf(shift);
    const date = new Date(dateStr);

    if (currentShiftIndex === 0) {
      date.setDate(date.getDate() - 1);
      return {
        date: format(date, 'yyyy-MM-dd'),
        shift: 'DH',
      };
    } else {
      return {
        date: dateStr,
        shift: shifts[currentShiftIndex - 1],
      };
    }
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      // Get all valid items
      const { data: validItems, error: itemsError } = await supabase
        .from('valid_items')
        .select('name')
        .order('name');

      if (itemsError) throw itemsError;
      if (!validItems || validItems.length === 0) {
        toast({
          title: 'Info',
          description: 'Tidak ada item dalam database',
          variant: 'default',
        });
        setReport([]);
        return;
      }

      // Get previous shift info
      const previousShiftInfo = getPreviousShiftInfo(selectedDate, selectedShift);

      // Get previous snapshot
      const { data: prevSnapshot } = await supabase
        .from('inventory_snapshots')
        .select('snapshot_data')
        .eq('id', `${previousShiftInfo.date}_${previousShiftInfo.shift}`)
        .maybeSingle();

      // Calculate report for each item
      const reportData: StockReport[] = [];

      for (const item of validItems) {
        const itemName = item.name;

        // Get stock awal from previous snapshot
        const stockAwal = prevSnapshot?.snapshot_data?.[itemName] || 0;

        // Get transactions for selected date and shift
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        const { data: transactions } = await supabase
          .from('inventory_transactions')
          .select('action, quantity')
          .eq('item_name', itemName)
          .eq('shift', selectedShift)
          .eq('status', 'processed')
          .gte('timestamp', startOfDay.toISOString())
          .lte('timestamp', endOfDay.toISOString());

        let masuk = 0;
        let keluar = 0;

        transactions?.forEach(t => {
          if (t.action === 'MASUK') {
            masuk += t.quantity;
          } else {
            keluar += t.quantity;
          }
        });

        const sisaAkhir = stockAwal + masuk - keluar;

        reportData.push({
          item_name: itemName,
          stock_awal: stockAwal,
          masuk,
          keluar,
          sisa_akhir: sisaAkhir,
        });
      }

      setReport(reportData);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Laporan Stok per Shift</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Tanggal</Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shift">Shift</Label>
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

          <div className="flex items-end">
            <Button onClick={handleGenerateReport} disabled={loading} className="w-full">
              <FileText className="h-4 w-4 mr-2" />
              Tampilkan Laporan
            </Button>
          </div>
        </div>

        {report.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Barang</TableHead>
                  <TableHead className="text-right">Stok Awal</TableHead>
                  <TableHead className="text-right">Masuk</TableHead>
                  <TableHead className="text-right">Keluar</TableHead>
                  <TableHead className="text-right">Sisa Akhir</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.map((row) => (
                  <TableRow key={row.item_name}>
                    <TableCell className="font-medium">{row.item_name}</TableCell>
                    <TableCell className="text-right">{row.stock_awal}</TableCell>
                    <TableCell className="text-right text-success font-medium">
                      {row.masuk}
                    </TableCell>
                    <TableCell className="text-right text-destructive font-medium">
                      {row.keluar}
                    </TableCell>
                    <TableCell
                      className={`text-right font-bold ${
                        row.sisa_akhir <= 5 ? 'text-destructive' : ''
                      }`}
                    >
                      {row.sisa_akhir}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};