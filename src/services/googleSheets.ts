import { GoogleAuth } from 'google-auth-library';
import { sheets_v4 } from 'googleapis';
import type { CalculationData } from '../types';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const CREDENTIALS_PATH = '/credentials.json';

export class GoogleSheetsService {
  private auth: GoogleAuth;
  private sheets: sheets_v4.Sheets;

  constructor() {
    this.auth = new GoogleAuth({
      keyFile: CREDENTIALS_PATH,
      scopes: SCOPES,
    });
    this.sheets = new sheets_v4.Sheets({ auth: this.auth });
  }

  // Criar headers da planilha
  private getHeaders(): string[] {
    return [
      'Data',
      'Hora', 
      'Orçamento',
      'Qtd Leads',
      'CPL',
      'CPL Status',
      'Qtd MQL',
      'Custo por MQL',
      '% MQL',
      'MQL Status',
      'Qtd Desqualificados',
      '% Desqualificados',
      'Desq Status',
      'Reuniões Marcadas',
      'Reuniões Acontecidas',
      'No-show',
      'Contratos',
      'Contas Integradas',
      'Atividades SDR',
      'Atividade SDR/MQL',
      '% Conectividade SDR',
      'Meta CPL',
      'Meta MQL',
      'Meta Desq'
    ];
  }

  // Converter dados de cálculo para linha da planilha
  private formatCalculationRow(calc: CalculationData, targets: { cplMax: number; mqlMin: number; desqMax: number }): (string | number)[] {
    const cplOk = calc.results.cpl <= targets.cplMax;
    const mqlOk = calc.results.pctMQL >= targets.mqlMin;
    const desqOk = calc.results.pctDesq <= targets.desqMax;

    return [
      calc.timestamp.toLocaleDateString('pt-BR'),
      calc.timestamp.toLocaleTimeString('pt-BR'),
      calc.inputs.orcamento,
      calc.inputs.qLeads,
      calc.results.cpl,
      cplOk ? 'OK' : 'ALERTA',
      calc.inputs.qMQL,
      calc.results.custoPorMQL,
      calc.results.pctMQL,
      mqlOk ? 'OK' : 'ALERTA',
      calc.inputs.qDesq,
      calc.results.pctDesq,
      desqOk ? 'OK' : 'ALERTA',
      calc.inputs.qReuMarc,
      calc.inputs.qReuAcont,
      calc.results.noShow,
      calc.inputs.qContratos,
      calc.inputs.qContasInt,
      calc.inputs.atividadesSDR,
      calc.results.atividadePorMQL,
      calc.results.conectividadeSDR,
      targets.cplMax,
      targets.mqlMin,
      targets.desqMax
    ];
  }

  // Exportar dados para Google Sheets
  async exportCalculations(
    spreadsheetId: string, 
    calculations: CalculationData[], 
    targets: { cplMax: number; mqlMin: number; desqMax: number },
    sheetName: string = 'Fire Banking - Calculations'
  ): Promise<void> {
    try {
      // Preparar dados
      const headers = this.getHeaders();
      const rows = calculations.map(calc => this.formatCalculationRow(calc, targets));
      const values = [headers, ...rows];

      // Verificar se a planilha existe
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId,
      });

      // Verificar se a aba existe
      const sheet = spreadsheet.data.sheets?.find(s => s.properties?.title === sheetName);
      
      if (!sheet) {
        // Criar nova aba
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [{
              addSheet: {
                properties: {
                  title: sheetName
                }
              }
            }]
          }
        });
      }

      // Limpar dados existentes e inserir novos
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `${sheetName}!A:Z`,
      });

      // Inserir dados
      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'RAW',
        requestBody: {
          values,
        },
      });

      // Formatar header
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            repeatCell: {
              range: {
                sheetId: sheet?.properties?.sheetId || 0,
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

      console.log('✅ Dados exportados para Google Sheets com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao exportar para Google Sheets:', error);
      throw error;
    }
  }

  // Obter URL de autenticação OAuth
  getAuthUrl(): string {
    // Para OAuth web flow, você precisará implementar o fluxo completo
    return 'https://accounts.google.com/o/oauth2/auth'; // Placeholder
  }
}