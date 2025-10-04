
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = React.useState({
    email_notifications_enabled: true,
    budget_alerts_enabled: true,
  });
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (!response.ok) throw new Error('Failed to fetch settings');
        const data = await response.json();
        setSettings({
          email_notifications_enabled: data.email_notifications_enabled === 'true',
          budget_alerts_enabled: data.budget_alerts_enabled === 'true',
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
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
              <Input id="name" placeholder="Seu nome" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="seu@email.com" />
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
                <Label htmlFor="budget-alerts" className="text-base">Alertas de Orçamento</Label>
                 <p className="text-sm text-muted-foreground">
                  Receba notificações quando se aproximar ou exceder um orçamento.
                </p>
              </div>
              <Switch
                id="budget-alerts"
                checked={settings.budget_alerts_enabled}
                onCheckedChange={(checked) => handleSettingChange('budget_alerts_enabled', checked)}
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
            <Button variant="outline">Alterar Senha</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
