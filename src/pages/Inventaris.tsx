import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputTransaksi } from '@/components/inventaris/InputTransaksi';
import { RiwayatTransaksi } from '@/components/inventaris/RiwayatTransaksi';
import { LaporanStok } from '@/components/inventaris/LaporanStok';
import { ShiftManager } from '@/components/inventaris/ShiftManager';

const Inventaris = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Inventaris</h1>
        <p className="text-muted-foreground">Manajemen stok dan transaksi inventaris</p>
      </div>

      <ShiftManager />

      <Tabs defaultValue="input" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="input">Input Transaksi</TabsTrigger>
          <TabsTrigger value="riwayat">Riwayat Transaksi</TabsTrigger>
          <TabsTrigger value="laporan">Lihat Laporan</TabsTrigger>
        </TabsList>

        <TabsContent value="input" className="space-y-4">
          <InputTransaksi />
        </TabsContent>

        <TabsContent value="riwayat">
          <RiwayatTransaksi />
        </TabsContent>

        <TabsContent value="laporan">
          <LaporanStok />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Inventaris;