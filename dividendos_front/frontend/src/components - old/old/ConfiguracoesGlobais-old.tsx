import { useEffect, useState } from "react";
import axios from "axios";

export default function ConfiguracoesGlobais() {
  const [configuracoes, setConfiguracoes] = useState<any[]>([]);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    axios.get("http://localhost:8000/config").then((res) => {
      setConfiguracoes(res.data);
    });
  }, []);

  const atualizarConfig = async (chave: string, novoValor: number) => {
    try {
      await axios.put(`http://localhost:8000/config/${chave}`, null, {
        params: { valor: novoValor },
      });
      setMensagem("✅ Configuração salva com sucesso!");
      setTimeout(() => setMensagem(""), 3000);
    } catch (e) {
      console.error("Erro ao salvar:", e);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded shadow mt-6">
      <h2 className="text-xl font-bold mb-4">⚙️ Configurações Globais</h2>
      {mensagem && (
        <div className="mb-4 text-green-700 bg-green-100 border border-green-300 p-2 rounded">
          {mensagem}
        </div>
      )}

      <ul className="space-y-4">
        {configuracoes.map((conf) => (
          <li key={conf.chave} className="flex items-center justify-between">
            <span className="font-semibold">{conf.chave}</span>
            <input
              type="number"
              value={conf.valor}
              onChange={(e) => {
                const novas = configuracoes.map((c) =>
                  c.chave === conf.chave ? { ...c, valor: parseFloat(e.target.value) } : c
                );
                setConfiguracoes(novas);
              }}
              className="border p-1 rounded w-24 text-right"
            />
            <button
              className="ml-2 bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
              onClick={() => atualizarConfig(conf.chave, conf.valor)}
            >
              Salvar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
