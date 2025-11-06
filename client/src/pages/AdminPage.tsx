
import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function AdminPage() {
  const [users, setUsers] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch('/api/admin/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os usuários.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateLicense = async (userId, newStatus, expiryDate) => {
    try {
      const response = await apiFetch(`/api/admin/users/${userId}/license`, {
        method: 'PUT',
        body: JSON.stringify({
          license_status: newStatus,
          license_expiry_date: expiryDate,
        }),
      });
      if (!response.ok) throw new Error('Failed to update license');
      
      toast({
        title: 'Sucesso',
        description: 'Licença do usuário atualizada.',
      });
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a licença.',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    });
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'expired':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  function ManageLicenseDialog({ user, onUpdate }) {
    const [expiryDate, setExpiryDate] = React.useState(user.license_expiry_date?.split('T')[0] || '');

    const handleActivate = () => {
        const newExpiryDate = expiryDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0];
        onUpdate(user.id, 'active', newExpiryDate);
    };

    const handleDeactivate = () => {
        onUpdate(user.id, 'inactive', null);
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">Gerenciar</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Gerenciar Licença</AlertDialogTitle>
                    <AlertDialogDescription>
                        Gerencie a licença para o usuário {user.email}.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4">
                    <p>Status Atual: <Badge variant={getStatusVariant(user.license_status)}>{user.license_status}</Badge></p>
                    <div className="space-y-2">
                        <Label htmlFor="expiry-date">Data de Expiração</Label>
                        <Input 
                            id="expiry-date" 
                            type="date" 
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Deixe em branco para ativar por 1 ano a partir de hoje.
                        </p>
                    </div>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <Button variant="destructive" onClick={handleDeactivate}>Desativar</Button>
                    <AlertDialogAction onClick={handleActivate}>Ativar/Atualizar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Painel do Administrador</h2>
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Carregando usuários...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Status da Licença</TableHead>
                  <TableHead>Expiração</TableHead>
                  <TableHead>Registrado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell><Badge variant={user.role === 'admin' ? 'outline' : 'secondary'}>{user.role}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(user.license_status)}>
                        {user.license_status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(user.license_expiry_date)}</TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                    <TableCell className="text-right">
                        {user.role !== 'admin' && <ManageLicenseDialog user={user} onUpdate={handleUpdateLicense} />}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
