import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, FileText, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const POSReport = () => {
  const [file, setFile] = useState<File | null>(null);
  const [akMasuk, setAkMasuk] = useState('');
  const [abMasuk, setAbMasuk] = useState('');
  const [sisaAk, setSisaAk] = useState('');
  const [sisaAb, setSisaAb] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'application/pdf'];
      if (validTypes.includes(selectedFile.type)) {
        setFile(selectedFile);
      } else {
        toast({
          title: 'Error',
          description: 'Hanya file PNG, JPG, GIF, atau PDF yang diperbolehkan',
          variant: 'destructive',
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setDialogMessage('Error: Pilih file terlebih dahulu');
      setShowDialog(true);
      return;
    }

    setLoading(true);
    setDialogMessage('Mengirim...');
    setShowDialog(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('masuk_ak', akMasuk || '0');
      formData.append('masuk_ab', abMasuk || '0');
      formData.append('sisa_ak', sisaAk || '0');
      formData.append('sisa_ab', sisaAb || '0');

      const response = await fetch('https://gogo111.app.n8n.cloud/webhook/2d707310-7e14-4635-b919-ed2a8a390581', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setDialogMessage('Berhasil!');
        setFile(null);
        setAkMasuk('');
        setAbMasuk('');
        setSisaAk('');
        setSisaAb('');
      } else {
        setDialogMessage('Terjadi Kesalahan');
      }
    } catch (error) {
      setDialogMessage('Terjadi Kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">POS Report</h1>
        <p className="text-muted-foreground">Laporan Point of Sale</p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Formulir Laporan POS</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Upload File *</Label>
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".png,.jpg,.jpeg,.gif,.pdf"
                  onChange={handleFileChange}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  {file ? (
                    <div className="space-y-2">
                      {file.type.startsWith('image/') ? (
                        <Image className="h-12 w-12 mx-auto text-primary" />
                      ) : (
                        <FileText className="h-12 w-12 mx-auto text-primary" />
                      )}
                      <p className="font-medium">{file.name}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                      <p className="text-muted-foreground">
                        Klik untuk pilih file atau seret dan lepas
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, GIF atau PDF
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ak-masuk">AK Masuk</Label>
                <Input
                  id="ak-masuk"
                  type="number"
                  value={akMasuk}
                  onChange={(e) => setAkMasuk(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ab-masuk">AB Masuk</Label>
                <Input
                  id="ab-masuk"
                  type="number"
                  value={abMasuk}
                  onChange={(e) => setAbMasuk(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sisa-ak">Sisa AK</Label>
                <Input
                  id="sisa-ak"
                  type="number"
                  value={sisaAk}
                  onChange={(e) => setSisaAk(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sisa-ab">Sisa AB</Label>
                <Input
                  id="sisa-ab"
                  type="number"
                  value={sisaAb}
                  onChange={(e) => setSisaAb(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              Kirim Laporan
            </Button>
          </form>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogMessage}</DialogTitle>
          </DialogHeader>
          <Button onClick={() => setShowDialog(false)}>Tutup</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default POSReport;