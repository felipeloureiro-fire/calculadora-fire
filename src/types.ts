export interface CalculationData {
  id: string;
  timestamp: Date;
  inputs: {
    orcamento: number;
    qLeads: number;
    qMQL: number;
    qDesq: number;
    qReuMarc: number;
    qReuAcont: number;
    qContratos: number;
    qContasInt: number;
    atividadesSDR: number;
  };
  results: {
    cpl: number;
    custoPorMQL: number;
    pctDesq: number;
    noShow: number;
    atividadePorMQL: number;
    conectividadeSDR: number;
    pctMQL: number;
  };
  status: {
    cplOk: boolean;
    mqlOk: boolean;
    desqOk: boolean;
  };
}