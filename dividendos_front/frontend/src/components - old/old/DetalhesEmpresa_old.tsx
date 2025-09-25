import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

export default function DetalhesEmpresa() {
  const { empresaId } = useParams();
  const [detalhes, setDetalhes] = useState<any>(null);
  const [anoSelecionado, setAnoSelecionado] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const buscarDetalhes = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/empresas/${empresaId}/detalhes`);
        const empresaData = res.data;
        const dadosOrdenados = empresaData.dados_financeiros.sort((a: any, b: any) => b.ano - a.ano); // mais recente primeiro
        setAnoSelecionado(dadosOrdenados[0]?.ano || null); // definir ano mais recente
        setDetalhes({ ...empresaData, dados_financeiros: dadosOrdenados });
      } catch (err) {
        console.error("Erro ao buscar detalhes", err);
      } finally {
        setLoading(false);
      }
    };
    buscarDetalhes();
  }, [empresaId]);

  if (loading) return <p className="text-center mt-6">⏳ Carregando detalhes da empresa...</p>;
  if (!detalhes) return <p className="text-center text-red-600 mt-6">❌ Dados não encontrados.</p>;

  const { empresa, dados_financeiros } = detalhes;
  const dadosDoAno = dados_financeiros.find((d: any) => d.ano === anoSelecionado);

  return (
    <div className="max-w-5xl mx-auto bg-white p-8 rounded-lg shadow-lg space-y-8">
      <h1 className="text-3xl font-bold text-center text-blue-700">📚 Detalhes da Empresa</h1>

      {/* Informações Básicas da Empresa */}
      <div className="bg-gray-100 p-6 rounded">
        <h2 className="text-xl font-semibold mb-4">🧾 Informações Básicas</h2>
        <div className="grid grid-cols-2 gap-4">
          <p><strong>ID:</strong> {empresa.id}</p>
          <p><strong>Nome:</strong> {empresa.nome}</p>
          <p><strong>Ticker:</strong> {empresa.ticker}</p>
          <p><strong>Número de ações:</strong> {empresa.numero_acoes.toLocaleString()}</p>
        </div>
      </div>

      {/* Seleção de Ano */}
      <div>
        <label htmlFor="anoSelecionado" className="block mb-2 text-sm font-medium text-gray-700">📅 Selecionar Ano</label>
        <select
          id="anoSelecionado"
          value={anoSelecionado || ""}
          onChange={(e) => setAnoSelecionado(Number(e.target.value))}
          className="border border-gray-300 rounded px-4 py-2 mb-6"
        >
          {dados_financeiros.map((dado: any) => (
            <option key={dado.ano} value={dado.ano}>{dado.ano}</option>
          ))}
        </select>
      </div>

      {/* Dados Financeiros */}
      {dadosDoAno ? (
        <div className="border border-gray-300 p-6 rounded bg-gray-50 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">💰 Dados Financeiros de {dadosDoAno.ano}</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <p><strong>Lucro T1:</strong> R$ {dadosDoAno.lucro_t1}</p>
            <p><strong>Lucro T2:</strong> R$ {dadosDoAno.lucro_t2}</p>
            <p><strong>Lucro T3:</strong> R$ {dadosDoAno.lucro_t3}</p>
            <p><strong>Lucro T4:</strong> R$ {dadosDoAno.lucro_t4}</p>
            <p><strong>Lucro líquido anual:</strong> R$ {dadosDoAno.lucro_liquido_anual}</p>
            <p><strong>Dividendos por ação:</strong> R$ {dadosDoAno.dividendo_por_acao}</p>
            <p><strong>Preço YF:</strong> R$ {dadosDoAno.preco_yf}</p>
            <p><strong>Preço teto:</strong> R$ {dadosDoAno.preco_teto}</p>
            <p><strong>Margem:</strong> {(dadosDoAno.margem * 100).toFixed(1)}%</p>
            <p><strong>Tipo de análise:</strong> {dadosDoAno.tipo_analise}</p>
            <p><strong>Payout projetado:</strong> {dadosDoAno.payout_projetado}</p>
            <p><strong>Recomendação:</strong> {dadosDoAno.recomendacao || "N/A"}</p>
          </div>
          <p className="mt-4 text-sm text-gray-600"><strong>🔎 Vantagens:</strong> {dadosDoAno.vantagens}</p>
          <p className="text-sm text-gray-600"><strong>⚠️ Desvantagens:</strong> {dadosDoAno.desvantagens}</p>
        </div>
      ) : (
        <p className="text-center text-gray-500">Nenhum dado financeiro encontrado para o ano selecionado.</p>
      )}
    </div>
  );
}
