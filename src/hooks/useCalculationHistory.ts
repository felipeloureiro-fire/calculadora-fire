import { useState, useEffect } from 'react';
import { CalculationData } from '../types';

const STORAGE_KEY = 'fire-banking-calculations';

export function useCalculationHistory() {
  const [history, setHistory] = useState<CalculationData[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setHistory(parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })));
      } catch (error) {
        console.warn('Failed to load calculation history:', error);
      }
    }
  }, []);

  const saveCalculation = (data: Omit<CalculationData, 'id' | 'timestamp'>) => {
    const newCalculation: CalculationData = {
      ...data,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };

    const newHistory = [newCalculation, ...history].slice(0, 50); // Keep last 50 calculations
    setHistory(newHistory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const exportToGoogleSheets = async (spreadsheetId: string, sheetName: string = 'Calculations') => {
    // This will be implemented with Google Sheets API
    const data = history.map(calc => [
      calc.timestamp.toLocaleDateString('pt-BR'),
      calc.timestamp.toLocaleTimeString('pt-BR'),
      calc.inputs.orcamento,
      calc.inputs.qLeads,
      calc.results.cpl,
      calc.inputs.qMQL,
      calc.results.custoPorMQL,
      calc.inputs.qDesq,
      calc.results.pctDesq,
      calc.inputs.qReuMarc,
      calc.inputs.qReuAcont,
      calc.results.noShow,
      calc.inputs.qContratos,
      calc.inputs.qContasInt,
      calc.inputs.atividadesSDR,
      calc.results.atividadePorMQL,
      calc.results.conectividadeSDR,
      calc.results.pctMQL,
      calc.status.cplOk ? 'OK' : 'ALERTA',
      calc.status.mqlOk ? 'OK' : 'ALERTA',
      calc.status.desqOk ? 'OK' : 'ALERTA'
    ]);

    // For now, return CSV data that can be copied to clipboard
    const headers = [
      'Data', 'Hora', 'Orçamento', 'Qtd Leads', 'CPL', 'Qtd MQL', 'Custo por MQL',
      'Qtd Desq', '% Desq', 'Reu. Marcadas', 'Reu. Acontecidas', 'No-show',
      'Contratos', 'Contas Integradas', 'Atividades SDR', 'Atividade SDR/MQL',
      '% Conectividade SDR', '% MQL', 'Status CPL', 'Status MQL', 'Status Desq'
    ];
    
    const csv = [headers, ...data].map(row => 
      row.map(cell => typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell).join(',')
    ).join('\n');
    
    return csv;
  };

  return {
    history,
    saveCalculation,
    clearHistory,
    exportToGoogleSheets
  };
}