import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import EditarEmpresaModal from "../components/EditarEmpresaModal";
import Dashboard from "../components/Dashboard";


export default function InformacoesEmpresa() {
  const { empresaId } = useParams();
  const navigate = useNavigate();
  const [detalhes, setDetalhes] = useState<any>(null);
  const [anoSelecionado, setAnoSelecionado] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalEmpresa, setModalEmpresa] = useState(null);

  useEffect(() => {
    buscarDetalhes();
  }, [empresaId]);

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

  const excluirEmpresa = async (id: number) => {
    if (!confirm("Deseja realmente excluir esta empresa?")) return;
    try {
      await axios.delete(`http://localhost:8000/empresas/${id}`);
      alert("Empresa excluída com sucesso.");
      navigate("/");
    } catch (err) {
      console.error("Erro ao excluir empresa", err);
    }
  };

  if (loading) return <p className="text-center mt-6">⏳ Carregando informações...</p>;
  if (!detalhes) return <p className="text-center text-red-600 mt-6">❌ Dados não encontrados.</p>;

  const { empresa, dados_financeiros } = detalhes;
  const dadosDoAno = dados_financeiros.find((d: any) => d.ano === anoSelecionado);

  const dadosComAnoAnterior = dados_financeiros.map((item, index, arr) => {
    const anterior = arr[index - 1];
    return {
      ...item,
      dividendo_ano_anterior: anterior ? anterior.dividendo_por_acao : null,
    };
  });

  return (
    <div className="max-w-6xl mx-auto bg-white p-8 rounded-lg shadow-lg space-y-10">
      <h1 className="text-3xl font-bold text-center text-blue-700">🏢 {empresa.nome} ({empresa.ticker})</h1>

      {/* Dados básicos */}
      <section className="bg-gray-100 p-6 rounded flex justify-between items-center">
        <div>
          <p><strong>ID:</strong> {empresa.id}</p>
          <p><strong>Número de ações:</strong> {empresa.numero_acoes.toLocaleString()}</p>
        </div>
        <div className="flex gap-4">
          <button className="text-blue-600 hover:underline" onClick={() => setModalEmpresa(empresa)}>✏️ Editar</button>
          <button className="text-red-600 hover:underline" onClick={() => excluirEmpresa(empresa.id)}>🗑️ Excluir</button>
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

      {/* Indicadores principais */}
      {dadosDoAno && (
        <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card><CardContent className="text-center"><p className="text-sm">Cotação</p><p className="text-xl font-bold">R$ {dadosDoAno.cotacao_yf.toFixed(2)}</p></CardContent></Card>
          <Card><CardContent className="text-center"><p className="text-sm">Preço Teto</p><p className="text-xl font-bold">R$ {dadosDoAno.preco_teto.toFixed(2)}</p></CardContent></Card>
          <Card><CardContent className="text-center"><p className="text-sm">Yield E*</p><p className="text-xl font-bold">{(dadosDoAno.yield_projetado * 100).toFixed(2)}%</p></CardContent></Card>
          <Card><CardContent className="text-center"><p className="text-sm">Crescimento E*</p><p className="text-xl font-bold">{(dadosDoAno.crescimento_estimado_lucro * 100).toFixed(2)}%</p></CardContent></Card>
          <Card><CardContent className="text-center"><p className="text-sm">Margem de Segurança</p><p className="text-xl font-bold">{(dadosDoAno.margem * 100).toFixed(2)}%</p></CardContent></Card>
        </section>
      )}

      {/* Resumo e recomendação */}
      {dadosDoAno && (
        <section className="text-center">
          <h2 className="text-xl font-bold mb-2">📊 Resumo {dadosDoAno.ano}</h2>
          <Badge className={`px-4 py-2 text-lg ${dadosDoAno.recomendacao_temp === "Comprar" ? "bg-green-500" : dadosDoAno.recomendacao_temp === "Vender" ? "bg-red-500" : "bg-yellow-500"}`}>
            {dadosDoAno.recomendacao_temp || "N/A"}
          </Badge>
        </section>
      )}

      

      {modalEmpresa && (
        <EditarEmpresaModal
          empresa={modalEmpresa}
          onClose={() => setModalEmpresa(null)}
          onSave={buscarDetalhes}
        />
      )}
      {dados_financeiros && (
        <section className="bg-gray-100 p-6 rounded shadow mt-10">
          <h2 className="text-xl font-bold text-center mb-4 text-blue-700">📊 Painel de Análise Completa</h2>
          <Dashboard empresa={empresa} dados={dados_financeiros} />
        </section>
      )}



      {/* Detalhamento completo */}
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
            <p><strong>Payout E*:</strong> {(dadosDoAno.payout_projetado * 100)}%</p>
            <p><strong>CAGR (5 anos):</strong> {(dadosDoAno.cagr * 100).toFixed(2)}%</p>
            <p><strong>Ajuste no Dividendo:</strong> {(dadosDoAno.ajuste_dividendo * 100).toFixed(2)}%</p>
            <p><strong>Motivo do Ajuste:</strong> {dadosDoAno.ajuste_motivo}</p>
            <p><strong>Variação YoY:</strong> {(dadosDoAno.variacao_yoy * 100).toFixed(2)}%</p>
            <p><strong>LPA Estimada:</strong> R$ {dadosDoAno.lpa_estimada.toFixed(2)}</p>
            <p><strong>Dividendo E*:</strong> R$ {dadosDoAno.dividendo_projetado_calc.toFixed(2)}</p>
            <p><strong>Tipo de análise:</strong> {dadosDoAno.tipo_analise}</p>
          </div>
        </section>
      )}

      {/* Vantagens e desvantagens */}
      {dadosDoAno && (
        <section className="p-6 rounded bg-white border shadow-sm">
          <h2 className="text-xl font-semibold mb-4">📌 Observações</h2>
          <ul className="list-disc list-inside text-green-600 mb-4">
            <li><strong>Vantagens:</strong> {dadosDoAno.vantagens}</li>
          </ul>
          <ul className="list-disc list-inside text-red-600">
            <li><strong>Desvantagens:</strong> {dadosDoAno.desvantagens}</li>
          </ul>
        </section>
      )}
    </div>
  );
}
