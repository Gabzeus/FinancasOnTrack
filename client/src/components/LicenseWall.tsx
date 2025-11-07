
import * as React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LicenseWallProps {
  children: React.ReactNode;
  isLicenseActive: boolean;
}

export function LicenseWall({ children, isLicenseActive }: LicenseWallProps) {
  if (isLicenseActive) {
    return <>{children}</>;
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Card className="border-destructive">
        <CardHeader className="flex flex-row items-center gap-4">
          <ShieldAlert className="h-8 w-8 text-destructive" />
          <CardTitle className="text-destructive">Licença Inativa ou Expirada</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Sua licença para usar o FinTrack não está ativa. Por favor, entre em contato com o administrador do sistema para ativar sua conta e ter acesso a todas as funcionalidades.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
