import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

export const RiwayatTransaksi = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const { data, error } = await supabase
        .from('inventory_transactions')
        .select('*')
        .eq('status', 'processed')
        .gte('timestamp', twentyFourHoursAgo.toISOString())
        .order('timestamp', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Riwayat Transaksi (24 Jam Terakhir)</CardTitle>
        <Button size="sm" variant="outline" onClick={fetchHistory} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Tidak ada riwayat transaksi
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Aksi</TableHead>
                  <TableHead>Nama Barang</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-sm">
                      {format(new Date(t.timestamp), 'HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded bg-secondary text-secondary-foreground text-xs font-medium">
                        {t.shift}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          t.action === 'MASUK'
                            ? 'bg-success text-success-foreground'
                            : 'bg-destructive text-destructive-foreground'
                        }`}
                      >
                        {t.action}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{t.item_name}</TableCell>
                    <TableCell className="text-right">{t.quantity}</TableCell>
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