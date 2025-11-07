
import * as React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Wallet } from 'lucide-react';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const token = searchParams.get('token');

  React.useEffect(() => {
    if (!token) {
      toast({
        title: 'Erro',
        description: 'Token de redefinição de senha não encontrado.',
        variant: 'destructive',
      });
      navigate('/login');
    }
  }, [token, navigate, toast]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem.',
        variant: 'destructive',
      });
      return;
    }
    if (!token) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Falha ao redefinir a senha.');
      }
      toast({
        title: 'Sucesso',
        description: 'Sua senha foi redefinida. Por favor, faça login com sua nova senha.',
      });
      navigate('/login');
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-[400px]">
        <div className="flex justify-center mb-4">
          <div className="flex items-center gap-2 font-semibold text-2xl">
            <Wallet className="h-8 w-8 text-primary" />
            <span className="">FinTrack</span>
          </div>
        </div>
        <form onSubmit={handleResetPassword}>
          <Card>
            <CardHeader>
              <CardTitle>Redefinir Senha</CardTitle>
              <CardDescription>
                Digite sua nova senha abaixo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="new-password">Nova Senha</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full bg-primary hover:bg-primary/90" type="submit" disabled={isLoading}>
                {isLoading ? 'Redefinindo...' : 'Redefinir Senha'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}
