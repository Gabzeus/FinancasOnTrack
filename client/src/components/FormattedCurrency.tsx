
import * as React from 'react';

interface FormattedCurrencyProps {
  value: number;
  valueClasses?: string;
  symbolClasses?: string;
}

export function FormattedCurrency({ value, valueClasses = '', symbolClasses = 'text-lg' }: FormattedCurrencyProps) {
  const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const parts = formatter.formatToParts(value);

  return (
    <span>
      {parts.map((part, index) => {
        switch (part.type) {
          case 'currency':
            return <span key={index} className={symbolClasses}>{part.value}</span>;
          case 'integer':
          case 'group':
          case 'decimal':
          case 'fraction':
            return <span key={index} className={valueClasses}>{part.value}</span>;
          case 'literal':
             // This handles the space between symbol and value
             return <span key={index} className={valueClasses}> </span>;
          default:
            return <span key={index}>{part.value}</span>;
        }
      })}
    </span>
  );
}
