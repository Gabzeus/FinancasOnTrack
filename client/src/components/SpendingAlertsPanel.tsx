import { AlertCircle, TrendingUp, Info } from "lucide-react";
import { Card, CardContent } from "./ui/card";

interface Alert {
  type: string;
  category: string;
  message: string;
  severity: "info" | "warning" | "critical";
  percentageUsed?: number;
}

interface SpendingAlertsPanelProps {
  alerts: Alert[];
  isLoading?: boolean;
}

export function SpendingAlertsPanel({ alerts, isLoading = false }: SpendingAlertsPanelProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-green-800">Tudo certo!</h3>
              <p className="text-green-700 text-sm">
                Você está dentro do seu orçamento para este período.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert, idx) => {
        const isWarning = alert.severity === "warning";
        const isCritical = alert.severity === "critical";

        const borderColor = isCritical
          ? "border-red-300"
          : isWarning
            ? "border-yellow-300"
            : "border-blue-300";

        const bgColor = isCritical
          ? "bg-red-50"
          : isWarning
            ? "bg-yellow-50"
            : "bg-blue-50";

        const iconColor = isCritical
          ? "text-red-600"
          : isWarning
            ? "text-yellow-600"
            : "text-blue-600";

        const textColor = isCritical
          ? "text-red-800"
          : isWarning
            ? "text-yellow-800"
            : "text-blue-800";

        return (
          <Card key={idx} className={`border-2 ${borderColor} ${bgColor}`}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                {isCritical ? (
                  <AlertCircle className={`h-5 w-5 ${iconColor} mt-0.5 flex-shrink-0`} />
                ) : (
                  <TrendingUp className={`h-5 w-5 ${iconColor} mt-0.5 flex-shrink-0`} />
                )}
                <div className="flex-1">
                  <h3 className={`font-semibold ${textColor} capitalize`}>
                    {alert.category}
                  </h3>
                  <p className={`text-sm ${textColor} mt-1`}>
                    {alert.message}
                  </p>
                  {alert.percentageUsed !== undefined && (
                    <div className="mt-3">
                      <div className="w-full bg-gray-300 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            isCritical
                              ? "bg-red-600"
                              : isWarning
                                ? "bg-yellow-600"
                                : "bg-blue-600"
                          }`}
                          style={{
                            width: `${Math.min(alert.percentageUsed, 100)}%`
                          }}
                        />
                      </div>
                      <p className="text-xs mt-1 font-semibold">
                        {Math.min(alert.percentageUsed, 100).toFixed(0)}% utilizado
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
