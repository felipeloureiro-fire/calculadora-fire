import type { CalculationData } from '../types';
import { GoogleAuthNewService } from './googleAuthNew';

// Usar a nova Google Identity Services
declare global {
  interface Window {
    gapi: any;
  }
}

export class GoogleSheetsWebService {
  private authService: GoogleAuthNewService;

  constructor() {
    console.log('🏗️ GoogleSheetsWebService construtor chamado');
    this.authService = new GoogleAuthNewService();
    console.log('✅ GoogleSheetsWebService criado com sucesso');
  }

  async initialize(): Promise<void> {
    await this.authService.initialize();
  }

  async authenticate(): Promise<boolean> {
    return await this.authService.signIn();
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  async signOut(): Promise<void> {
    await this.authService.signOut();
  }

  // Criar headers da planilha
  private getHeaders(): string[] {
    return [
      'Data', 'Hora', 'Orçamento', 'Qtd Leads', 'CPL', 'CPL Status',
      'Qtd MQL', 'Custo por MQL', '% MQL', 'MQL Status',
      'Qtd Desqualificados', '% Desqualificados', 'Desq Status',
      'Reuniões Marcadas', 'Reuniões Acontecidas', 'No-show',
      'Contratos', 'Contas Integradas', 'Atividades SDR',
      'Atividade SDR/MQL', '% Conectividade SDR',
      'Meta CPL', 'Meta MQL', 'Meta Desq'
    ];
  }

  // Converter dados para linha da planilha
  private formatCalculationRow(
    calc: CalculationData, 
    targets: { cplMax: number; mqlMin: number; desqMax: number }
  ): (string | number)[] {
    const cplOk = calc.results.cpl <= targets.cplMax;
    const mqlOk = calc.results.pctMQL >= targets.mqlMin;
    const desqOk = calc.results.pctDesq <= targets.desqMax;

    return [
      calc.timestamp.toLocaleDateString('pt-BR'),
      calc.timestamp.toLocaleTimeString('pt-BR'),
      calc.inputs.orcamento,
      calc.inputs.qLeads,
      Number(calc.results.cpl.toFixed(2)),
      cplOk ? 'OK' : 'ALERTA',
      calc.inputs.qMQL,
      Number(calc.results.custoPorMQL.toFixed(2)),
      Number(calc.results.pctMQL.toFixed(4)),
      mqlOk ? 'OK' : 'ALERTA',
      calc.inputs.qDesq,
      Number(calc.results.pctDesq.toFixed(4)),
      desqOk ? 'OK' : 'ALERTA',
      calc.inputs.qReuMarc,
      calc.inputs.qReuAcont,
      calc.results.noShow,
      calc.inputs.qContratos,
      calc.inputs.qContasInt,
      calc.inputs.atividadesSDR,
      Number(calc.results.atividadePorMQL.toFixed(2)),
      Number(calc.results.conectividadeSDR.toFixed(4)),
      targets.cplMax,
      Number(targets.mqlMin.toFixed(2)),
      Number(targets.desqMax.toFixed(2))
    ];
  }

  // Criar nova planilha
  async createSpreadsheet(title: string = 'Fire Banking - Performance Calculator'): Promise<string> {
    const response = await window.gapi.client.sheets.spreadsheets.create({
      resource: {
        properties: {
          title
        }
      }
    });
    
    return response.result.spreadsheetId!;
  }

  // Exportar cálculo atual para planilha compartilhada (adiciona nova linha)
  async appendCalculation(
    spreadsheetId: string,
    calculation: CalculationData,
    targets: { cplMax: number; mqlMin: number; desqMax: number },
    sheetName: string = 'Calculations'
  ): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error('Usuário não autenticado. Faça login primeiro.');
    }

    try {
      // Primeiro, verificar se a planilha existe
      console.log('🔍 Verificando planilha:', spreadsheetId);
      
      // Verificar se planilha tem headers
      let existingData;
      
      try {
        existingData = await window.gapi.client.sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${sheetName}!A1:Z1`,
        });
        console.log('✅ Range acessado com sucesso');
      } catch (error: any) {
        console.log('⚠️ Erro ao acessar range, tentando criar aba:', error);
        
        // Se o erro é sobre a aba não existir, criar a aba
        if (error.status === 400) {
          console.log('📝 Criando aba:', sheetName);
          await window.gapi.client.sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            resource: {
              requests: [{
                addSheet: {
                  properties: {
                    title: sheetName
                  }
                }
              }]
            }
          });
          
          console.log('✅ Aba criada, tentando acessar range novamente...');
          // Tentar novamente após criar a aba
          existingData = await window.gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${sheetName}!A1:Z1`,
          });
        } else {
          throw error;
        }
      }

      // Se não tem headers, adicionar
      if (!existingData.result.values || existingData.result.values.length === 0) {
        const headers = this.getHeaders();
        await window.gapi.client.sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${sheetName}!A1`,
          valueInputOption: 'RAW',
          resource: {
            values: [headers],
          },
        });

        // Formatar cabeçalhos
        await window.gapi.client.sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          resource: {
            requests: [{
              repeatCell: {
                range: {
                  startRowIndex: 0,
                  endRowIndex: 1,
                  startColumnIndex: 0,
                  endColumnIndex: headers.length
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
                    textFormat: { bold: true }
                  }
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat)'
              }
            }]
          }
        });
      }

      // Adicionar nova linha com o cálculo atual
      const newRow = this.formatCalculationRow(calculation, targets);
      await window.gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetName}!A:Z`,
        valueInputOption: 'RAW',
        resource: {
          values: [newRow],
        },
      });

    } catch (error) {
      console.error('Erro ao exportar:', error);
      throw error;
    }
  }

  // Limpar planilha e exportar todos os dados (evita duplicatas)
  async clearAndExportAll(
    spreadsheetId: string,
    calculations: CalculationData[],
    targets: { cplMax: number; mqlMin: number; desqMax: number },
    sheetName: string = 'Calculations'
  ): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error('Usuário não autenticado. Faça login primeiro.');
    }

    try {
      // Limpar dados existentes (mantém apenas headers)
      await window.gapi.client.sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `${sheetName}!A2:Z`,
      });

      // Preparar todas as linhas de dados
      const rows = calculations.map(calc => 
        this.formatCalculationRow(calc, targets)
      );

      if (rows.length > 0) {
        // Adicionar todos os dados de uma vez
        await window.gapi.client.sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${sheetName}!A2`,
          valueInputOption: 'RAW',
          resource: {
            values: rows,
          },
        });
      }

      console.log(`✅ ${calculations.length} cálculos exportados (sem duplicatas)`);
    } catch (error) {
      console.error('Erro ao exportar todos os dados:', error);
      throw error;
    }
  }
}