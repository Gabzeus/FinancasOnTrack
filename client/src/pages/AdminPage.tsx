
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminPage() {
  const [users, setUsers] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

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

  const handleUpdateUser = async (userId, newStatus, expiryDate, newRole) => {
    try {
      const response = await apiFetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({
          license_status: newStatus,
          license_expiry_date: expiryDate,
          role: newRole,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user');
      }
      
      toast({
        title: 'Sucesso',
        description: 'Usuário atualizado.',
      });
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível atualizar o usuário.',
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

  function ManageUserDialog({ user, onUpdate }) {
    const [expiryDate, setExpiryDate] = React.useState(user.license_expiry_date?.split('T')[0] || '');
    const [role, setRole] = React.useState(user.role);
    const [licenseStatus, setLicenseStatus] = React.useState(user.license_status);

    const handleSave = () => {
        let newExpiryDate = expiryDate;
        if (licenseStatus === 'active' && !expiryDate) {
            newExpiryDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0];
        } else if (licenseStatus === 'inactive') {
            newExpiryDate = null;
        }
        onUpdate(user.id, licenseStatus, newExpiryDate, role);
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">Gerenciar</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Gerenciar Usuário</AlertDialogTitle>
                    <AlertDialogDescription>
                        Gerencie a licença e a função para o usuário {user.email}.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="role">Função</Label>
                        <Select value={role} onValueChange={setRole} disabled={user.id === currentUser?.id}>
                            <SelectTrigger id="role">
                                <SelectValue placeholder="Selecione a função" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="user">Usuário</SelectItem>
                                <SelectItem value="admin">Administrador</SelectItem>
                            </SelectContent>
                        </Select>
                        {user.id === currentUser?.id && <p className="text-xs text-muted-foreground">Você não pode alterar sua própria função.</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="license-status">Status da Licença</Label>
                        <Select value={licenseStatus} onValueChange={setLicenseStatus}>
                            <SelectTrigger id="license-status">
                                <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Ativa</SelectItem>
                                <SelectItem value="inactive">Inativa</SelectItem>
                                <SelectItem value="expired">Expirada</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="expiry-date">Data de Expiração</Label>
                        <Input 
                            id="expiry-date" 
                            type="date" 
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                            disabled={licenseStatus !== 'active'}
                        />
                        <p className="text-xs text-muted-foreground">
                            Se a licença estiver ativa, deixe em branco para definir 1 ano a partir de hoje.
                        </p>
                    </div>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSave}>Salvar Alterações</AlertDialogAction>
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
                  <TableHead>Função</TableHead>
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
                        <ManageUserDialog user={user} onUpdate={handleUpdateUser} />
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
