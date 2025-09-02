import { gapi } from 'gapi-script';
import type { CalculationData } from '../types';
import { GoogleAuthService } from './googleAuth';

export class GoogleSheetsWebService {
  private authService: GoogleAuthService;

  constructor() {
    this.authService = new GoogleAuthService();
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
    const response = await gapi.client.sheets.spreadsheets.create({
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
      // Verificar se planilha tem headers
      const existingData = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A1:Z1`,
      });

      // Se não tem headers, adicionar
      if (!existingData.result.values || existingData.result.values.length === 0) {
        const headers = this.getHeaders();
        await gapi.client.sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${sheetName}!A1`,
          valueInputOption: 'RAW',
          resource: {
            values: [headers],
          },
        });

        // Formatar cabeçalhos
        await gapi.client.sheets.spreadsheets.batchUpdate({
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
      await gapi.client.sheets.spreadsheets.values.append({
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
}