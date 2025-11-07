
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
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

function ChangePasswordDialog() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const { toast } = useToast();

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As novas senhas não coincidem.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await apiFetch('/api/settings/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Falha ao alterar a senha.');
      }
      toast({
        title: 'Sucesso!',
        description: 'Sua senha foi alterada.',
      });
      setIsOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline">Alterar Senha</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Alterar Senha</AlertDialogTitle>
          <AlertDialogDescription>
            Para sua segurança, por favor, insira sua senha atual e a nova senha.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Senha Atual</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Nova Senha</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-new-password">Confirmar Nova Senha</Label>
            <Input
              id="confirm-new-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleChangePassword}>Salvar Nova Senha</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function SettingsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [settings, setSettings] = React.useState({
    email_notifications_enabled: true,
    credit_card_limit_alerts_enabled: true,
  });
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await apiFetch('/api/settings');
        if (!response.ok) throw new Error('Failed to fetch settings');
        const data = await response.json();
        setSettings({
          email_notifications_enabled: data.email_notifications_enabled === 'true',
          credit_card_limit_alerts_enabled: data.credit_card_limit_alerts_enabled === 'true',
        });
      } catch (error) {
        console.error(error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as configurações.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [toast]);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveChanges = async () => {
    try {
      const response = await apiFetch('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      if (!response.ok) throw new Error('Failed to save settings');
      toast({
        title: 'Sucesso!',
        description: 'Configurações salvas com sucesso!',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erro',
        description: 'Falha ao salvar as configurações.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
        <Button onClick={handleSaveChanges}>Salvar Alterações</Button>
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
            <CardDescription>Atualize as informações da sua conta.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" placeholder="Seu nome" disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="seu@email.com" value={user?.email || ''} disabled />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notificações</CardTitle>
            <CardDescription>Gerencie como você recebe notificações.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications" className="text-base">Notificações por Email</Label>
                <p className="text-sm text-muted-foreground">
                  Receba emails sobre atividade na sua conta.
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={settings.email_notifications_enabled}
                onCheckedChange={(checked) => handleSettingChange('email_notifications_enabled', checked)}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="credit-card-limit-alerts" className="text-base">Alertas de Limite do Cartão</Label>
                 <p className="text-sm text-muted-foreground">
                  Receba notificações quando se aproximar do limite de um cartão de crédito.
                </p>
              </div>
              <Switch
                id="credit-card-limit-alerts"
                checked={settings.credit_card_limit_alerts_enabled}
                onCheckedChange={(checked) => handleSettingChange('credit_card_limit_alerts_enabled', checked)}
                disabled={!settings.email_notifications_enabled}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="push-notifications" className="text-base">Notificações Push</Label>
                 <p className="text-sm text-muted-foreground">
                  Receba notificações push no seu dispositivo. (Em breve)
                </p>
              </div>
              <Switch id="push-notifications" disabled />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Segurança</CardTitle>
            <CardDescription>Gerencie as configurações de segurança da sua conta.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="two-factor" className="text-base">Autenticação de Dois Fatores (2FA)</Label>
                 <p className="text-sm text-muted-foreground">
                  Adicione uma camada extra de segurança à sua conta. (Em breve)
                </p>
              </div>
              <Switch id="two-factor" disabled />
            </div>
            <ChangePasswordDialog />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
