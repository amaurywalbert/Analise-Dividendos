import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

export default function InformacoesEmpresa() {
  const { empresaId } = useParams();
  const [detalhes, setDetalhes] = useState<any>(null);
  const [anoSelecionado, setAnoSelecionado] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const buscarDetalhes = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/empresas/${empresaId}/detalhes`);
        const empresaData = res.data;

        const dadosOrdenados = empresaData.dados_financeiros.sort((a: any, b: any) => b.ano - a.ano);
        setAnoSelecionado(dadosOrdenados[0]?.ano || null);
        setDetalhes({ ...empresaData, dados_financeiros: dadosOrdenados });
      } catch (err) {
        console.error("Erro ao buscar detalhes", err);
      } finally {
        setLoading(false);
      }
    };

    buscarDetalhes();
  }, [empresaId]);

  if (loading) return <p className="text-center mt-6">⏳ Carregando informações...</p>;
  if (!detalhes) return <p className="text-center text-red-600 mt-6">❌ Dados não encontrados.</p>;

  const { empresa, dados_financeiros } = detalhes;
  const dadosDoAno = dados_financeiros.find((d: any) => d.ano === anoSelecionado);
  // 👀 Vamos ver no console o que veio do servidor
  console.log("Dados financeiros:", dados_financeiros);
  console.log("Dados do ano selecionado:", dadosDoAno);

  return (
    <div className="max-w-5xl mx-auto bg-white p-8 rounded-lg shadow-lg space-y-10">
      {/* Título */}
      <h1 className="text-3xl font-bold text-center text-blue-700">🏢 Informações da Empresa</h1>

      {/* Bloco: Informações básicas */}
      <section className="bg-gray-100 p-6 rounded">
        <h2 className="text-xl font-semibold mb-4">🧾 Dados Gerais</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <p><strong>ID:</strong> {empresa.id}</p>
          <p><strong>Nome:</strong> {empresa.nome}</p>
          <p><strong>Ticker:</strong> {empresa.ticker}</p>
          <p><strong>Número de ações:</strong> {empresa.numero_acoes.toLocaleString()}</p>
        </div>
      </section>

      {/* Seletor de ano */}
      <section>
        <label htmlFor="anoSelecionado" className="block mb-2 text-sm font-medium text-gray-700">📅 Selecione o Ano</label>
        <select
          id="anoSelecionado"
          value={anoSelecionado || ""}
          onChange={(e) => setAnoSelecionado(Number(e.target.value))}
          className="border border-gray-300 rounded px-4 py-2"
        >
          {dados_financeiros.map((dado: any) => (
            <option key={dado.ano} value={dado.ano}>{dado.ano}</option>
          ))}
        </select>
      </section>

      {/* Bloco: Resumo */}
      {dadosDoAno && (
        <section className="bg-blue-50 p-6 rounded shadow-sm max-w-md mx-auto">
          <h2 className="text-xl font-bold mb-4 text-center">📊 Resumo Financeiro ({dadosDoAno.ano})</h2>
          <p><strong>Preço atual:</strong> R$ {dadosDoAno.preco_atual.toFixed(2)}</p>
          <p><strong>Preço teto:</strong> R$ {dadosDoAno.preco_teto.toFixed(2)}</p>
          <p><strong>Margem:</strong> {(dadosDoAno.margem * 100).toFixed(2)}%</p>

          {/* Crescimento Estimado do Lucro */}
          {typeof dadosDoAno.crescimento_estimado_lucro === "number" && (
            <p>
              <strong>Crescimento Estimado:</strong>{" "}
              <span
                className={`inline-block px-2 py-1 text-xs rounded font-semibold ${
                  dadosDoAno.crescimento_estimado_lucro >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}
              >
                {(dadosDoAno.crescimento_estimado_lucro * 100).toFixed(2)}%
              </span>
            </p>
          )}


          <p className="mt-4 font-semibold text-blue-600">📌 Recomendação: {dadosDoAno.recomendacao || "N/A"}</p>
        </section>
      )}

      {/* Bloco: Detalhamento */}
      {dadosDoAno && (
        <section className="border border-gray-300 p-6 rounded bg-gray-50 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">💰 Detalhes Financeiros ({dadosDoAno.ano})</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <p><strong>Lucro T1:</strong> R$ {dadosDoAno.lucro_t1}</p>
            <p><strong>Lucro T2:</strong> R$ {dadosDoAno.lucro_t2}</p>
            <p><strong>Lucro T3:</strong> R$ {dadosDoAno.lucro_t3}</p>
            <p><strong>Lucro T4:</strong> R$ {dadosDoAno.lucro_t4}</p>
            <p><strong>Lucro líquido anual:</strong> R$ {dadosDoAno.lucro_liquido_anual}</p>
            <p><strong>LPA:</strong> R$ {dadosDoAno.lpa.toFixed(2)}</p>
            <p><strong>Dividendos por ação ano anterior:</strong> R$ {dadosDoAno.dividendo_por_acao}</p>
            <p><strong>Payout projetado:</strong> {(dadosDoAno.payout_projetado * 100)}%</p>
            <p><strong>CAGR (5 anos):</strong> {(dadosDoAno.cagr * 100).toFixed(2)}%</p>
            <p><strong>Ajuste no Dividendo:</strong> {(dadosDoAno.ajuste_dividendo * 100).toFixed(2)}%</p>
            <p><strong>Motivo do Ajuste no Dividendo:</strong> {dadosDoAno.ajuste_motivo}</p>
            <p><strong>Tipo de análise:</strong> {dadosDoAno.tipo_analise}</p>
            <p><strong>Variação YoY Acumulada:</strong>{" "} {(dadosDoAno.variacao_yoy * 100).toFixed(2)}%</p>
            <p><strong>LPA Estimada:</strong> R$ {dadosDoAno.lpa_estimada.toFixed(2)}</p>
            <p><strong>Dividendo Projetado:</strong> R$ {dadosDoAno.dividendo_projetado_calc.toFixed(2)}</p>
            
          </div>
          <p className="mt-4 text-sm text-gray-600"><strong>🔎 Vantagens:</strong> {dadosDoAno.vantagens}</p>
          <p className="text-sm text-gray-600"><strong>⚠️ Desvantagens:</strong> {dadosDoAno.desvantagens}</p>
        </section>
      )}
    </div>
  );
}
