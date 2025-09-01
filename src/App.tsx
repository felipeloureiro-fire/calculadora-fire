import React, { useMemo, useState } from "react";
import { useCalculationHistory } from "./hooks/useCalculationHistory";

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
  setValue:(n:number)=>void;
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
          value={Number.isNaN(value as number) ? "" : value}
          onChange={(e)=> setValue(Number(e.target.value))}
          min={0}
        />
        {suffix && <span className="text-gray-500 text-sm pr-1">{suffix}</span>}
      </div>
    </label>
  )
}

export default function App(){
  const { history, saveCalculation, clearHistory, exportToGoogleSheets } = useCalculationHistory();
  
  // Entradas (controladas)
  const [orcamento, setOrcamento] = useState<number>(0);
  const [qLeads, setQLeads] = useState<number>(0);
  const [qMQL, setQMQL] = useState<number>(0); // Qtd Leads Qualificados
  const [qDesq, setQDesq] = useState<number>(0); // Qtd Leads Desqualificados
  const [qReuMarc, setQReuMarc] = useState<number>(0);
  const [qReuAcont, setQReuAcont] = useState<number>(0);
  const [qContratos, setQContratos] = useState<number>(0);
  const [qContasInt, setQContasInt] = useState<number>(0);
  const [atividadesSDR, setAtividadesSDR] = useState<number>(0);

  // Regras-alvo
  const CPL_MAX = 40;           // R$ 40,00
  const MQL_MIN = 0.30;         // 30%
  const DESQ_MAX = 0.15;        // 15%

  // Cálculos derivados
  const calc = useMemo(()=>{
    const safeDiv = (a:number, b:number) => (b && isFinite(a/b)) ? a/b : 0;
    const cpl = safeDiv(orcamento, qLeads);
    const custoPorMQL = safeDiv(orcamento, qMQL);
    const pctDesq = safeDiv(qDesq, qLeads);
    const noShow = Math.max(0, qReuMarc - qReuAcont);
    const atividadePorMQL = safeDiv(atividadesSDR, qMQL);
    const conectividadeSDR = safeDiv(qReuMarc, qMQL); // Reuniões marcadas por MQL
    const pctMQL = safeDiv(qMQL, qLeads);

    return {
      cpl, custoPorMQL, pctDesq, noShow, atividadePorMQL, conectividadeSDR, pctMQL
    };
  }, [orcamento, qLeads, qMQL, qDesq, qReuMarc, qReuAcont, atividadesSDR]);

  // Status das metas
  const status = useMemo(()=>({
    cplOk: calc.cpl <= CPL_MAX || (!qLeads && orcamento === 0),
    mqlOk: calc.pctMQL >= MQL_MIN || (!qLeads && qMQL === 0),
    desqOk: calc.pctDesq <= DESQ_MAX || (!qLeads && qDesq === 0),
  }), [calc, qLeads, qMQL, qDesq, orcamento]);

  // Função para salvar cálculo atual
  const handleSaveCalculation = () => {
    saveCalculation({
      inputs: { orcamento, qLeads, qMQL, qDesq, qReuMarc, qReuAcont, qContratos, qContasInt, atividadesSDR },
      results: calc,
      status
    });
  };

  // Função para exportar para Google Sheets
  const handleExport = async () => {
    const csvData = await exportToGoogleSheets();
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fire-banking-calculations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Pequeno cartão KPI
  const KPI = ({ title, value, helper }:{ title:string; value:React.ReactNode; helper?:string }) => (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-gray-500">{title}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {helper && <div className="mt-1 text-xs text-gray-500">{helper}</div>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Calculadora de Performance — Fire Banking</h1>
          <p className="text-gray-600 mt-1">Preencha os campos de entrada e veja os indicadores e o status das metas em tempo real.</p>
          
          {/* Botões de ação */}
          <div className="flex flex-wrap gap-3 mt-4">
            <button 
              onClick={handleSaveCalculation}
              className="px-4 py-2 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors"
            >
              💾 Salvar Cálculo
            </button>
            <button 
              onClick={handleExport}
              className="px-4 py-2 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition-colors"
            >
              📊 Exportar CSV
            </button>
            {history.length > 0 && (
              <button 
                onClick={clearHistory}
                className="px-4 py-2 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-colors"
              >
                🗑️ Limpar Histórico
              </button>
            )}
            <span className="text-sm text-gray-500 self-center">
              {history.length} cálculo{history.length !== 1 ? 's' : ''} salvos
            </span>
          </div>
        </header>

        {/* Status geral */}
        <div className="flex flex-wrap gap-2 mb-6">
          <StatusBadge ok={status.cplOk} label={`CPL ≤ ${fmtMoney(CPL_MAX)}`} />
          <StatusBadge ok={status.mqlOk} label={"% MQL ≥ 30%"} />
          <StatusBadge ok={status.desqOk} label={"% Desqualificados ≤ 15%"} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Painel de Entradas */}
          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Entradas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </section>

          {/* Painel de Resultados */}
          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Resultados</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <KPI title="CPL" value={fmtMoney(calc.cpl)} helper="= Orçamento / Qtd Leads" />
              <KPI title="Custo por MQL" value={fmtMoney(calc.custoPorMQL)} helper="= Orçamento / MQL" />
              <KPI title="% MQL" value={fmtPct(calc.pctMQL)} helper="= MQL / Qtd Leads" />
              <KPI title="% Desqualificados" value={fmtPct(calc.pctDesq)} helper="= Desqualificados / Qtd Leads" />
              <KPI title="Qtd No-show" value={isFinite(calc.noShow) ? Math.round(calc.noShow) : 0} helper="= Marcadas − Acontecidas (mín. 0)" />
              <KPI title="Atividade SDR/MQL" value={isFinite(calc.atividadePorMQL) ? calc.atividadePorMQL.toFixed(2) : "0.00"} helper="= Atividades SDR / MQL" />
              <KPI title="% Conectividade do SDR" value={fmtPct(calc.conectividadeSDR)} helper="= Reuniões Marcadas / MQL" />
            </div>

            {/* Linha extra com close/activation se quiser ativar depois */}
            <div className="mt-4 text-xs text-gray-500">
              Regras: CPL ≤ {fmtMoney(CPL_MAX)} • % MQL ≥ 30% • % Desqualificados ≤ 15%
            </div>
          </section>
        </div>

        {/* Tabela-resumo estilo planilha */}
        <section className="rounded-2xl border bg-white p-5 shadow-sm mt-6">
          <h2 className="text-lg font-semibold mb-4">Resumo (estilo planilha)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  <th className="p-2 text-left">Orçamento</th>
                  <th className="p-2 text-left">Qtd Leads</th>
                  <th className="p-2 text-left">CPL</th>
                  <th className="p-2 text-left">Qtd MQL</th>
                  <th className="p-2 text-left">Custo por MQL</th>
                  <th className="p-2 text-left">Qtd Desq</th>
                  <th className="p-2 text-left">% Desq</th>
                  <th className="p-2 text-left">Reu. Marcadas</th>
                  <th className="p-2 text-left">Reu. Acontecidas</th>
                  <th className="p-2 text-left">No-show</th>
                  <th className="p-2 text-left">Contratos</th>
                  <th className="p-2 text-left">Contas Integradas</th>
                  <th className="p-2 text-left">Atividades SDR</th>
                  <th className="p-2 text-left">Atividade SDR/MQL</th>
                  <th className="p-2 text-left">% Conectividade SDR</th>
                  <th className="p-2 text-left">% MQL</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2">{fmtMoney(orcamento)}</td>
                  <td className="p-2">{qLeads}</td>
                  <td className="p-2">{fmtMoney(calc.cpl)}</td>
                  <td className="p-2">{qMQL}</td>
                  <td className="p-2">{fmtMoney(calc.custoPorMQL)}</td>
                  <td className="p-2">{qDesq}</td>
                  <td className="p-2">{fmtPct(calc.pctDesq)}</td>
                  <td className="p-2">{qReuMarc}</td>
                  <td className="p-2">{qReuAcont}</td>
                  <td className="p-2">{Math.round(calc.noShow)}</td>
                  <td className="p-2">{qContratos}</td>
                  <td className="p-2">{qContasInt}</td>
                  <td className="p-2">{atividadesSDR}</td>
                  <td className="p-2">{isFinite(calc.atividadePorMQL) ? calc.atividadePorMQL.toFixed(2) : "0.00"}</td>
                  <td className="p-2">{fmtPct(calc.conectividadeSDR)}</td>
                  <td className="p-2">{fmtPct(calc.pctMQL)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Rodapé com metas e indicadores de cor */}
          <div className="flex flex-wrap gap-2 mt-4">
            <StatusBadge ok={status.cplOk} label={`CPL ≤ ${fmtMoney(CPL_MAX)}`} />
            <StatusBadge ok={status.mqlOk} label={"% MQL ≥ 30%"} />
            <StatusBadge ok={status.desqOk} label={"% Desqualificados ≤ 15%"} />
          </div>
        </section>

        <footer className="text-xs text-gray-500 mt-8">
          ©️ {new Date().getFullYear()} Fire Banking — Calculadora de Performance.
        </footer>
      </div>
    </div>
  );
}