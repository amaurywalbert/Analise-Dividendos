import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

export default function ResumoEmpresa() {
  const { empresaId } = useParams();
  const [resumo, setResumo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const buscarResumo = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/empresas/${empresaId}/resumo`);
        setResumo(res.data);
      } catch (err) {
        console.error("Erro ao buscar resumo", err);
      } finally {
        setLoading(false);
      }
    };

    buscarResumo();
  }, [empresaId]);

  if (loading) return <p className="text-center">🔄 Carregando resumo da empresa...</p>;
  if (!resumo) return <p className="text-center text-red-600">❌ Resumo não encontrado.</p>;
  console.log("Resumo:", resumo);
  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4 text-center">📊 Resumo Financeiro</h2>
      <p><strong>Empresa:</strong> {resumo.empresa}</p>
      <p><strong>Ticker:</strong> {resumo.ticker}</p>
      <p><strong>Ano:</strong> {resumo.ano}</p>
      <p><strong>Preço atual:</strong> R$ {resumo.preco_atual.toFixed(2)}</p>
      {/*<p><strong>Lucro Líquido Anual:</strong> R$ {resumo.lucro_anual.toFixed(2)}</p>*/}
      <p><strong>Preço teto:</strong> R$ {resumo.preco_teto.toFixed(2)}</p>
      <p><strong>Margem:</strong> {(resumo.margem * 100).toFixed(2)}%</p>
      <p className="mt-4 font-semibold text-blue-600"> 📌 Recomendação: {resumo.recomendacao} </p>
    </div>
  );
}
