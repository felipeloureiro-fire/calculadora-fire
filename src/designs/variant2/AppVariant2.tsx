import React, { useMemo, useState } from "react";
import { useCalculationHistory } from "../../hooks/useCalculationHistory";
import { GoogleSheetsWebService } from "../../services/googleSheetsWeb";

// Utilidades de formatação (pt-BR)
const fmtMoney = (v:number) => isFinite(v) ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "R$ 0,00";
const fmtPct = (v:number) => isFinite(v) ? (v).toLocaleString("pt-BR", { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0%";

// Badge de status
function StatusBadge({ ok, label }:{ ok:boolean; label:string }){
  return (
    <span className={`px-3 py-1 rounded-2xl text-sm font-semibold ${ok ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
      {ok ? "OK" : "ALERTA"} <span className="opacity-70">• {label}</span>
    </span>
  );
}

// Campo numérico com label
function NumberField({ label, value, setValue, suffix, step = 1 }:{
  label:string;
  value:number | string;
  setValue:(n:number | '')=>void;
  suffix?:string;
  step?:number;
}){
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          step={step}
          className="w-full rounded-2xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800"
          value={value === '' ? '' : value}
          onChange={(e)=> setValue(e.target.value === '' ? '' : Number(e.target.value))}
          min={0}
          placeholder="0"
        />
        {suffix && <span className="text-gray-500 text-sm pr-1">{suffix}</span>}
      </div>
    </label>
  )
}

// Componente de Tab
function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
        active
          ? "bg-blue-600 text-white"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800"
      }`}
    >
      {children}
    </button>
  );
}

export default function AppVariant2(){
  const { history, saveCalculation, clearHistory } = useCalculationHistory();
  const [activeTab, setActiveTab] = useState<"entradas" | "resultados" | "resumo">("entradas");
  const [editingTargets, setEditingTargets] = useState(false);
  const [sheetsService] = useState(() => new GoogleSheetsWebService());
  const [isExporting, setIsExporting] = useState(false);
  
  // Entradas (controladas) - começam vazias para melhor UX
  const [orcamento, setOrcamento] = useState<number | ''>('');
  const [qLeads, setQLeads] = useState<number | ''>('');
  const [qMQL, setQMQL] = useState<number | ''>('');
  const [qDesq, setQDesq] = useState<number | ''>('');
  const [qReuMarc, setQReuMarc] = useState<number | ''>('');
  const [qReuAcont, setQReuAcont] = useState<number | ''>('');
  const [qContratos, setQContratos] = useState<number | ''>('');
  const [qContasInt, setQContasInt] = useState<number | ''>('');
  const [atividadesSDR, setAtividadesSDR] = useState<number | ''>('');

  // Regras-alvo (agora editáveis)
  const [cplMax, setCplMax] = useState<number>(40);
  const [mqlMin, setMqlMin] = useState<number>(0.30);
  const [desqMax, setDesqMax] = useState<number>(0.15);

  // Cálculos derivados (converte strings vazias para 0)
  const calc = useMemo(()=>{
    const safeDiv = (a:number, b:number) => (b && isFinite(a/b)) ? a/b : 0;
    const numOrcamento = Number(orcamento) || 0;
    const numQLeads = Number(qLeads) || 0;
    const numQMQL = Number(qMQL) || 0;
    const numQDesq = Number(qDesq) || 0;
    const numQReuMarc = Number(qReuMarc) || 0;
    const numQReuAcont = Number(qReuAcont) || 0;
    const numAtividadesSDR = Number(atividadesSDR) || 0;
    
    const cpl = safeDiv(numOrcamento, numQLeads);
    const custoPorMQL = safeDiv(numOrcamento, numQMQL);
    const pctDesq = safeDiv(numQDesq, numQLeads);
    const noShow = Math.max(0, numQReuMarc - numQReuAcont);
    const atividadePorMQL = safeDiv(numAtividadesSDR, numQMQL);
    const conectividadeSDR = safeDiv(numQReuMarc, numQMQL);
    const pctMQL = safeDiv(numQMQL, numQLeads);

    return {
      cpl, custoPorMQL, pctDesq, noShow, atividadePorMQL, conectividadeSDR, pctMQL
    };
  }, [orcamento, qLeads, qMQL, qDesq, qReuMarc, qReuAcont, atividadesSDR]);

  // Status das metas (usando valores editáveis)
  const status = useMemo(()=>({
    cplOk: calc.cpl <= cplMax || (!qLeads && orcamento === 0),
    mqlOk: calc.pctMQL >= mqlMin || (!qLeads && qMQL === 0),
    desqOk: calc.pctDesq <= desqMax || (!qLeads && qDesq === 0),
  }), [calc, qLeads, qMQL, qDesq, orcamento, cplMax, mqlMin, desqMax]);

  // Função para salvar cálculo atual
  const handleSaveCalculation = () => {
    saveCalculation({
      inputs: { 
        orcamento: Number(orcamento) || 0, 
        qLeads: Number(qLeads) || 0, 
        qMQL: Number(qMQL) || 0, 
        qDesq: Number(qDesq) || 0, 
        qReuMarc: Number(qReuMarc) || 0, 
        qReuAcont: Number(qReuAcont) || 0, 
        qContratos: Number(qContratos) || 0, 
        qContasInt: Number(qContasInt) || 0, 
        atividadesSDR: Number(atividadesSDR) || 0 
      },
      results: calc,
      status
    });
  };

  // Função para exportar para Google Sheets
  const handleExport = async () => {
    if (history.length === 0) {
      alert('Nenhum cálculo salvo para exportar.');
      return;
    }

    setIsExporting(true);
    try {
      // Inicializar serviço
      await sheetsService.initialize();
      
      // Autenticar usuário
      const isAuth = await sheetsService.authenticate();
      if (!isAuth) {
        alert('Falha na autenticação. Tente novamente.');
        return;
      }

      // Usar planilha compartilhada configurada
      const spreadsheetId = import.meta.env.VITE_GOOGLE_SPREADSHEET_ID;
      if (!spreadsheetId) {
        alert('❌ ID da planilha compartilhada não configurado. Verifique VITE_GOOGLE_SPREADSHEET_ID no arquivo .env');
        return;
      }
      
      // Adicionar apenas o cálculo atual como nova linha
      const currentCalculation = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        inputs: { 
          orcamento: Number(orcamento) || 0, 
          qLeads: Number(qLeads) || 0, 
          qMQL: Number(qMQL) || 0, 
          qDesq: Number(qDesq) || 0, 
          qReuMarc: Number(qReuMarc) || 0, 
          qReuAcont: Number(qReuAcont) || 0, 
          qContratos: Number(qContratos) || 0, 
          qContasInt: Number(qContasInt) || 0, 
          atividadesSDR: Number(atividadesSDR) || 0 
        },
        results: calc,
        status
      };

      await sheetsService.appendCalculation(
        spreadsheetId, 
        currentCalculation, 
        { cplMax, mqlMin, desqMax }
      );

      // Sucesso
      const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
      alert(`✅ Dados adicionados à planilha compartilhada!`);
      if (confirm(`Deseja abrir a planilha compartilhada?\n\n${spreadsheetUrl}`)) {
        window.open(spreadsheetUrl, '_blank');
      }
    } catch (error: any) {
      console.error('Erro na exportação:', error);
      
      if (error.status === 403) {
        alert('❌ Permissões insuficientes. Verifique as configurações da API.');
      } else {
        alert(`❌ Erro ao exportar: ${error.message || 'Erro desconhecido'}`);
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Pequeno cartão KPI
  const KPI = ({ title, value, helper }:{ title:string; value:React.ReactNode; helper?:string }) => (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-gray-500">{title}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {helper && <div className="mt-1 text-xs text-gray-500">{helper}</div>}
    </div>
  );

  // Renderizar conteúdo da aba ativa
  const renderTabContent = () => {
    switch (activeTab) {
      case "entradas":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <NumberField label="Orçamento (R$)" value={orcamento} setValue={setOrcamento} step={0.01} />
            <NumberField label="Qtd Leads" value={qLeads} setValue={setQLeads} />
            <NumberField label="Qtd Leads Qualificados (MQL)" value={qMQL} setValue={setQMQL} />
            <NumberField label="Qtd Leads Desqualificados" value={qDesq} setValue={setQDesq} />
            <NumberField label="Qtd Reuniões Marcadas" value={qReuMarc} setValue={setQReuMarc} />
            <NumberField label="Qtd Reuniões Acontecidas" value={qReuAcont} setValue={setQReuAcont} />
            <NumberField label="Qtd Contratos Assinados" value={qContratos} setValue={setQContratos} />
            <NumberField label="Qtd Contas Integradas" value={qContasInt} setValue={setQContasInt} />
            <NumberField label="Atividades SDR (ligações/touches)" value={atividadesSDR} setValue={setAtividadesSDR} />
          </div>
        );

      case "resultados":
        return (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <KPI title="CPL" value={fmtMoney(calc.cpl)} helper="= Orçamento / Qtd Leads" />
              <KPI title="Custo por MQL" value={fmtMoney(calc.custoPorMQL)} helper="= Orçamento / MQL" />
              <KPI title="% MQL" value={fmtPct(calc.pctMQL)} helper="= MQL / Qtd Leads" />
              <KPI title="% Desqualificados" value={fmtPct(calc.pctDesq)} helper="= Desqualificados / Qtd Leads" />
              <KPI title="Qtd No-show" value={isFinite(calc.noShow) ? Math.round(calc.noShow) : 0} helper="= Marcadas − Acontecidas (mín. 0)" />
              <KPI title="Atividade SDR/MQL" value={isFinite(calc.atividadePorMQL) ? calc.atividadePorMQL.toFixed(2) : "0.00"} helper="= Atividades SDR / MQL" />
              <KPI title="% Conectividade do SDR" value={fmtPct(calc.conectividadeSDR)} helper="= Reuniões Marcadas / MQL" />
            </div>

            <div className="mt-6 text-xs text-gray-500 text-center">
              Regras: CPL ≤ {fmtMoney(cplMax)} • % MQL ≥ {fmtPct(mqlMin)} • % Desqualificados ≤ {fmtPct(desqMax)}
            </div>

            {/* Botão salvar e contador na parte inferior */}
            <div className="mt-6 pt-4 border-t border-gray-200 flex justify-center items-center gap-4">
              <button 
                onClick={handleSaveCalculation}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                Salvar Cálculo
              </button>
              <span className="text-sm text-gray-500">
                {history.length} cálculo{history.length !== 1 ? 's' : ''} salvos
              </span>
            </div>
          </div>
        );

      case "resumo":
        return (
          <div>
            <h3 className="text-lg font-semibold mb-4 text-center">Histórico de Cálculos</h3>
            {history.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>Nenhum cálculo salvo ainda.</p>
                <p className="text-sm mt-2">Vá para a aba "Resultados" e clique em "Salvar Cálculo" para começar.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse bg-white rounded-lg shadow-sm overflow-hidden">
                  {/* Header da tabela */}
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">#</th>
                      <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Data/Hora</th>
                      <th className="text-right p-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Orçamento</th>
                      <th className="text-right p-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Leads</th>
                      <th className="text-right p-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">CPL</th>
                      <th className="text-right p-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">MQL</th>
                      <th className="text-right p-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">% MQL</th>
                      <th className="text-right p-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">% Desq</th>
                      <th className="text-right p-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Reuniões</th>
                      <th className="text-right p-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Contratos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item, index) => {
                      const itemStatus = {
                        cplOk: item.results.cpl <= cplMax,
                        mqlOk: item.results.pctMQL >= mqlMin,
                        desqOk: item.results.pctDesq <= desqMax,
                      };
                      
                      return (
                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-3 text-sm font-semibold text-gray-900">
                            {history.length - index}
                          </td>
                          <td className="p-3 text-sm text-gray-700">
                            <div>{item.timestamp.toLocaleDateString('pt-BR')}</div>
                            <div className="text-xs text-gray-500">{item.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                          </td>
                          <td className="p-3 text-sm text-right font-semibold text-gray-900">
                            {fmtMoney(item.inputs.orcamento)}
                          </td>
                          <td className="p-3 text-sm text-right text-gray-700">
                            {item.inputs.qLeads}
                          </td>
                          <td className="p-3 text-sm text-right">
                            <span className={`inline-flex items-center justify-center min-w-[80px] px-3 py-2 text-white text-xs font-bold shadow-sm hover:shadow-md transition-shadow ${itemStatus.cplOk ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`} style={{borderRadius: '20px'}}>
                              {fmtMoney(item.results.cpl)}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-right text-gray-700">
                            {item.inputs.qMQL}
                          </td>
                          <td className="p-3 text-sm text-right">
                            <span className={`inline-flex items-center justify-center min-w-[60px] px-3 py-2 text-white text-xs font-bold shadow-sm hover:shadow-md transition-shadow ${itemStatus.mqlOk ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`} style={{borderRadius: '20px'}}>
                              {fmtPct(item.results.pctMQL)}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-right">
                            <span className={`inline-flex items-center justify-center min-w-[60px] px-3 py-2 text-white text-xs font-bold shadow-sm hover:shadow-md transition-shadow ${itemStatus.desqOk ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`} style={{borderRadius: '20px'}}>
                              {fmtPct(item.results.pctDesq)}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-right text-gray-700">
                            {item.inputs.qReuMarc}/{item.inputs.qReuAcont}
                          </td>
                          <td className="p-3 text-sm text-right font-semibold text-green-700">
                            {item.inputs.qContratos}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                
                {/* Botão para limpar histórico */}
                {history.length > 0 && (
                  <div className="text-center mt-6">
                    <button 
                      onClick={clearHistory}
                      className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm"
                    >
                      Limpar Histórico
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header com logo */}
      <header className="bg-white border-b shadow-sm p-4">
        <div className="flex justify-between items-center w-full">
          <h1 className="text-xl font-bold text-gray-900">Fire Banking</h1>
          <div className="flex-1"></div>
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? 'Exportando...' : 'Exportar Google Sheets'}
          </button>
        </div>
      </header>

      <div className="p-4">
        {/* Título centralizado */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Calculadora de Performance</h2>
        </div>

        {/* Status badges centralizados com botão de edição */}
        <div className="flex flex-wrap justify-center items-center gap-3 mb-4">
          {editingTargets ? (
            <>
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl border px-3 py-2">
                <span className="text-sm">CPL ≤</span>
                <input 
                  type="number" 
                  value={cplMax} 
                  onChange={(e) => setCplMax(Number(e.target.value))}
                  className="w-16 text-sm border rounded px-1"
                  step="0.01"
                />
              </div>
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl border px-3 py-2">
                <span className="text-sm">MQL ≥</span>
                <input 
                  type="number" 
                  value={mqlMin * 100} 
                  onChange={(e) => setMqlMin(Number(e.target.value) / 100)}
                  className="w-16 text-sm border rounded px-1"
                  step="1"
                />
                <span className="text-sm">%</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl border px-3 py-2">
                <span className="text-sm">Desq ≤</span>
                <input 
                  type="number" 
                  value={desqMax * 100} 
                  onChange={(e) => setDesqMax(Number(e.target.value) / 100)}
                  className="w-16 text-sm border rounded px-1"
                  step="1"
                />
                <span className="text-sm">%</span>
              </div>
              <button 
                onClick={() => setEditingTargets(false)}
                className="px-3 py-1 bg-green-600 text-white rounded-xl hover:bg-green-700 text-sm"
              >
                Salvar
              </button>
            </>
          ) : (
            <>
              <StatusBadge ok={status.cplOk} label={`CPL ≤ ${fmtMoney(cplMax)}`} />
              <StatusBadge ok={status.mqlOk} label={`% MQL ≥ ${fmtPct(mqlMin)}`} />
              <StatusBadge ok={status.desqOk} label={`% Desqualificados ≤ ${fmtPct(desqMax)}`} />
              <button 
                onClick={() => setEditingTargets(true)}
                className="px-3 py-1 bg-gray-200 text-black rounded-xl hover:bg-gray-300 text-sm"
              >
                Editar Metas
              </button>
            </>
          )}
        </div>

        {/* Tab buttons centralizados */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          <TabButton 
            active={activeTab === "entradas"} 
            onClick={() => setActiveTab("entradas")}
          >
            Entradas
          </TabButton>
          <TabButton 
            active={activeTab === "resultados"} 
            onClick={() => setActiveTab("resultados")}
          >
            Resultados
          </TabButton>
          <TabButton 
            active={activeTab === "resumo"} 
            onClick={() => setActiveTab("resumo")}
          >
            Resumo
          </TabButton>
        </div>

        <div className="mx-auto max-w-6xl">
          {/* Conteúdo da aba ativa */}
          <div className="bg-white rounded-2xl border shadow-sm p-6">
            {renderTabContent()}
          </div>

          <footer className="text-xs text-gray-500 mt-6 text-center">
            ©️ {new Date().getFullYear()} Fire Banking — Calculadora de Performance.
          </footer>
        </div>
      </div>
    </div>
  );
}