import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import EditarEmpresaModal from "../components/EditarEmpresaModal";

export default function EmpresasList() {
  const [empresasDetalhadas, setEmpresasDetalhadas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalEmpresa, setModalEmpresa] = useState(null);
  const [atualizandoTodos, setAtualizandoTodos] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState("");


  useEffect(() => {
    const carregar = async () => {
      await fetchEmpresasDetalhadas();
      await atualizarTodosPrecos(); // já atualiza assim que carregar
    };
    carregar();
  }, []);

  const atualizarTodosPrecos = async () => {
    try {
      setAtualizandoTodos(true);
      for (const empresa of empresasDetalhadas) {
        const ano = empresa.resumoFinanceiro?.ano;
        if (!ano) continue;
        await axios.post(http://localhost:8000/empresas/${empresa.id}/dados/${ano}/atualizar_preco_yf);
      }
      await fetchEmpresasDetalhadas();
      setMensagemSucesso("✅ Preços atualizados com sucesso!");
      setTimeout(() => setMensagemSucesso(""), 3000);
    } catch (err) {
      console.error("Erro ao atualizar preços YF:", err);
    } finally {
      setAtualizandoTodos(false);
    }
  };


  const fetchEmpresasDetalhadas = async () => {
    try {
      const res = await axios.get("http://localhost:8000/empresas");
      const listaBase = res.data;

      const detalhesCompletos = await Promise.all(
        listaBase.map(async (empresa: any) => {
          const detalhes = await axios.get(http://localhost:8000/empresas/${empresa.id}/detalhes);
          const dadosOrdenados = detalhes.data.dados_financeiros.sort((a: any, b: any) => b.ano - a.ano);
          const resumo = dadosOrdenados[0];
          
          return {
            ...empresa,
            resumoFinanceiro: resumo,
            margem: resumo?.margem || 0,
          };
        })
      );

      const ordenadas = detalhesCompletos.sort((a, b) => b.margem - a.margem);
      setEmpresasDetalhadas(ordenadas);
    } catch (err) {
      console.error("Erro ao carregar empresas detalhadas", err);
    } finally {
      setLoading(false);
    }
  };

  const getRecomendacaoEstilo = (recomendacao: string) => {
    switch (recomendacao) {
      case "Comprar":
        return "text-green-600";
      case "Manter":
        return "text-yellow-600";
      case "Vender":
        return "text-red-600";
      default:
        return "text-gray-500";
    }
  };

  const getRecomendacaoIcone = (recomendacao: string) => {
    switch (recomendacao) {
      case "Comprar":
        return "✅";
      case "Manter":
        return "📊";
      case "Vender":
        return "⚠️";
      default:
        return "❔";
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center">📋 Empresas Cadastradas</h2>
      <button
        onClick={atualizarTodosPrecos}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        disabled={atualizandoTodos}
      >
        {atualizandoTodos ? "⏳ Atualizando preços..." : "🔄 Atualizar preço de todas"}
      </button>
      {mensagemSucesso && (
        <div className="mb-4 p-3 text-green-800 bg-green-100 rounded border border-green-300">
        {mensagemSucesso}
       </div>
      )}

      {loading ? (
        <p className="text-center">Carregando...</p>
      ) : empresasDetalhadas.length === 0 ? (
        <p className="text-center text-gray-600">Nenhuma empresa cadastrada</p>
      ) : (
        <ul className="space-y-4">
          {empresasDetalhadas.map((empresa: any) => (
            <li
              key={empresa.id}
              className="border p-4 rounded space-y-2 bg-gray-50 shadow hover:bg-gray-100 transition-colors"
            >
              <div className="flex flex-wrap justify-between items-center gap-2">
                <div>          
                  <p className="font-bold">
                    {empresa.nome} ({empresa.ticker})   
                    {empresa.resumoFinanceiro?.preco_yf !== undefined &&
                      <> - 📈 Preço YF: R$ {empresa.resumoFinanceiro.preco_yf.toFixed(2)}</>
                    } 
                  </p>
                  {empresa.resumoFinanceiro?.ultima_atualizacao !== undefined && (
                    <p className="text-sm text-gray-600">
                      Última cotação: {new Date(empresa.resumoFinanceiro.ultima_atualizacao).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }).replace(',', ' às')}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">Ano: {empresa.resumoFinanceiro?.ano}</p>
                </div>
                <div className="flex space-x-2">
                  <Link to={/informacoes/${empresa.id}} className="text-purple-600 hover:underline">
                    Informações
                  </Link>
                </div>
              </div>

              {empresa.resumoFinanceiro && (
                <div className="text-sm text-gray-700">
                  <hr className="my-2 border-gray-300" />
                  <p><strong>📏 Preço teto:</strong> R$ {empresa.resumoFinanceiro.preco_teto.toFixed(2)}</p>
                  <p><strong>📐 Margem:</strong> {(empresa.resumoFinanceiro.margem * 100).toFixed(2)}%</p>
                  <p className={mt-1 font-semibold ${getRecomendacaoEstilo(empresa.resumoFinanceiro.recomendacao)}}>
                    {getRecomendacaoIcone(empresa.resumoFinanceiro.recomendacao)} Recomendação: {empresa.resumoFinanceiro.recomendacao || "N/A"}
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {modalEmpresa && (
        <EditarEmpresaModal
          empresa={modalEmpresa}
          onClose={() => setModalEmpresa(null)}
          onSave={fetchEmpresasDetalhadas}
        />
      )}
    </div>
  );
}