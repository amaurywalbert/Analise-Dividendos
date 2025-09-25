import React from "react";
import TabelaFinanceira from "./TabelaFinanceira";
import GraficoPrecoTeto from "./GraficoPrecoTeto";
import GraficoDividendos from "./GraficoDividendos";
import GraficoCrescimento from "./GraficoCrescimento";

export default function Dashboard({ empresa, dados }) {
  const dadosOrdenados = [...dados].sort((a, b) => a.ano - b.ano);

  return (
    <div className="space-y-6 mt-6">
      <h3 className="text-xl font-bold text-center">📊 Análise de {empresa.ticker}</h3>
      <TabelaFinanceira dados={dadosOrdenados} />
      <GraficoPrecoTeto dados={dadosOrdenados} />
      <GraficoDividendos dados={dadosOrdenados} />
      <GraficoCrescimento dados={dadosOrdenados} />
    </div>
  );
}
