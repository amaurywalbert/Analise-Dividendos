import { Dialog } from "@headlessui/react";
import { useState, useEffect } from "react";
import axios from "axios";

export default function EditarEmpresaModal({ empresa, onClose, onSave }: any) {
  const [form, setForm] = useState({ ...empresa });
  const [novoAno, setNovoAno] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([]);
  const ultimoAnoSalvo = anosDisponiveis.length > 0 ? Math.max(...anosDisponiveis) : null;


  // Função para lidar com mudanças nos campos do formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };


  const handleAutoSave = async (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    const payload = {
      ...form,
      [name]: value,
      empresa_id: empresa.id,
      ano: Number(form.ano),
      numero_acoes: Number(form.numero_acoes),
      lucro_t1: Number(form.lucro_t1) || 0,
      lucro_t2: Number(form.lucro_t2) || 0,
      lucro_t3: Number(form.lucro_t3) || 0,
      lucro_t4: Number(form.lucro_t4) || 0,
      dividendo_por_acao: Number(form.dividendo_por_acao) || 0,
      payout_projetado: Number(form.payout_projetado) || 0,
      ajuste_dividendo: Number(form.ajuste_dividendo) || 0,
      /*preco_atual: Number(form.preco_atual) || 0,*/
      cagr: Number(form.cagr) || 0,
    };

    try {
      if (["nome", "ticker", "numero_acoes"].includes(name)) {
        await axios.put(`http://localhost:8000/empresas/${empresa.id}`, {
          nome: payload.nome,
          ticker: payload.ticker,
          numero_acoes: payload.numero_acoes,
        });
      }

      if (!anosDisponiveis.includes(Number(form.ano))) {
        // Criação de novo dado
        await axios.post(`http://localhost:8000/empresas/dados`, payload);

        // Adiciona novo ano à lista para habilitar autosave futuro como PUT
        setAnosDisponiveis((prev) => [...prev, Number(form.ano)]);
      } else {
        // Atualização de dado existente
        await axios.put(
          `http://localhost:8000/empresas/${empresa.id}/dados/${form.ano}`,
          payload
        );
      }
    } catch (err) {
      console.error("Erro ao salvar campo:", name, err);
    }
  };


  const handleAnoChange = async (e: any) => {
    const novoAno = Number(e.target.value);
    setForm((prev) => ({ ...prev, ano: novoAno }));

    try {
      const res = await axios.get(`http://localhost:8000/empresas/${empresa.id}/dados`);
      const dadoAno = res.data.find((d: any) => d.ano === novoAno);
      if (dadoAno) {
        setForm((prev) => ({ ...prev, ...dadoAno }));
      } else {
        // limpa os campos se o ano ainda não tiver sido cadastrado
        setForm((prev: any) => ({
          ...prev,
          ano: novoAno,
          lucro_t1: "",
          lucro_t2: "",
          lucro_t3: "",
          lucro_t4: "",
          dividendo_por_acao: "",
          payout_projetado: "",
          ajuste_dividendo: "",
          /*preco_atual: "",*/
          cagr: "",
          tipo_analise: "",
          ajuste_motivo: "",
          vantagens: "",
          desvantagens: "",
        }));
      }
    } catch {
      alert("Erro ao buscar dados do ano");
    }
  };



  const handleExcluirAno = async () => {
    if (!form.ano || !anosDisponiveis.includes(Number(form.ano))) {
      alert("Ano inválido ou ainda não salvo.");
      return;
    }

    if (!confirm(`Deseja realmente excluir os dados do ano ${form.ano}?`)) return;

    try {
      await axios.delete(`http://localhost:8000/empresas/${empresa.id}/dados/${form.ano}`);
      setAnosDisponiveis((prev) => prev.filter((a) => a !== Number(form.ano)));
      setForm((prev) => ({ ...prev, ano: "", lucro_t1: "", lucro_t2: "", lucro_t3: "", lucro_t4: "", dividendo_por_acao: "", payout_projetado: "", ajuste_dividendo: "", /*preco_atual: "",*/ cagr: "", tipo_analise: "", ajuste_motivo: "", vantagens: "", desvantagens: "" }));
      setNovoAno(null);
    } catch (err) {
      alert("Erro ao excluir dados do ano.");
      console.error(err);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Atualiza dados da empresa
      await axios.put(`http://localhost:8000/empresas/${empresa.id}`, {
        nome: form.nome,
        ticker: form.ticker.toUpperCase(),
        numero_acoes: Number(form.numero_acoes),
      });

      // Atualiza dados financeiros por ano
      await axios.put(`http://localhost:8000/empresas/${empresa.id}/dados/${form.ano}`, {
        empresa_id: empresa.id,  // ✅ ESSENCIAL
        ano: Number(form.ano),
        lucro_t1: Number(form.lucro_t1) || 0,
        lucro_t2: Number(form.lucro_t2) || 0,
        lucro_t3: Number(form.lucro_t3) || 0,
        lucro_t4: Number(form.lucro_t4) || 0,
        dividendo_por_acao: Number(form.dividendo_por_acao) || 0,
        payout_projetado: Number(form.payout_projetado) || 0,
        ajuste_dividendo: Number(form.ajuste_dividendo) || 0,
        /*preco_atual: Number(form.preco_atual) || 0,*/
        cagr: Number(form.cagr) || 0,
        tipo_analise: form.tipo_analise || "",
        ajuste_motivo: form.ajuste_motivo || "",
        vantagens: form.vantagens || "",
        desvantagens: form.desvantagens || "",
      });

      onSave();
      onClose();
    } catch (err) {
      alert("Erro ao editar empresa/dados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Busca os anos disponíveis para a empresa
    const buscarAnos = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/empresas/${empresa.id}/dados`);
        const dados = res.data || [];
        const anos = dados.map((d: any) => d.ano);
        setAnosDisponiveis([...new Set(anos)].sort((a, b) => b - a));

        if (dados.length > 0) {
          const dadosOrdenados = [...dados].sort((a, b) => b.ano - a.ano);
          const dadoMaisRecente = dadosOrdenados[0];
          setForm((prev) => ({ ...prev, ...dadoMaisRecente, ano: dadoMaisRecente.ano }));
        }

      } catch {
        setAnosDisponiveis([]);
      }
    };

    buscarAnos();
  }, [empresa.id]);

  const isNovoAno = !anosDisponiveis.includes(Number(form.ano));

  return (
    <Dialog open={true} onClose={onClose} className="fixed inset-0 z-50">
      <div className="flex items-center justify-center min-h-screen bg-black bg-opacity-40">
        <Dialog.Panel className="bg-white p-6 rounded-md w-full max-w-2xl">
          <Dialog.Title className="text-xl font-bold mb-4">
            ✏️ Editar Empresa e Dados Financeiros
          </Dialog.Title>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            {/* Campo: Nome */}
            <div>
              <label htmlFor="nome" className="block mb-1 font-medium text-gray-700">Nome</label>
              <input id="nome" name="nome" value={form.nome} onChange={handleChange} onBlur={handleAutoSave}
                placeholder="Nome" className="w-full border border-gray-300 px-3 py-2 rounded focus:ring focus:border-blue-500" />
            </div>

            {/* Campo: Ticker */}
            <div>
              <label htmlFor="ticker" className="block mb-1 font-medium text-gray-700">Ticker</label>
              <input id="ticker" name="ticker" value={form.ticker} onChange={handleChange} onBlur={handleAutoSave}
                placeholder="Ticker" className="w-full border border-gray-300 px-3 py-2 rounded focus:ring focus:border-blue-500" />
            </div>

            {/* Campo: Número de Ações */}
            <div>
              <label htmlFor="numero_acoes" className="block mb-1 font-medium text-gray-700">Número de Ações</label>
              <input id="numero_acoes" name="numero_acoes" type="number" value={form.numero_acoes}
                onChange={handleChange} onBlur={handleAutoSave} required placeholder="Número de Ações"
                className="w-full border border-gray-300 px-3 py-2 rounded focus:ring focus:border-blue-500" />
            </div>

            {/* Campo: Ano (Input ou Select) */}
            <div>
              <label htmlFor="ano" className="block mb-1 font-medium text-gray-700">Ano</label>
              {novoAno !== null || anosDisponiveis.length === 0 ? (
                <input
                  id="ano"
                  name="ano"
                  type="number"
                  value={form.ano || ""}
                  placeholder="Digite o novo ano"
                  onChange={(e) => {
                    const anoDigitado = Number(e.target.value);
                    if (anosDisponiveis.includes(anoDigitado)) {
                      alert(`⚠️ O ano ${anoDigitado} já existe para esta empresa.`);
                      return;
                    }
                    setForm((prev) => ({ ...prev, ano: isNaN(anoDigitado) ? "" : anoDigitado }));
                    setNovoAno(anoDigitado);
                  }}
                  className="w-full border border-red-500 px-3 py-2 rounded focus:ring focus:border-blue-500"
                />
              ) : (
                <select
                  id="ano"
                  name="ano"
                  value={form.ano || ""}
                  onChange={(e) => {
                    if (e.target.value === "novo") {
                      const maiorAno = anosDisponiveis.length > 0 ? Math.max(...anosDisponiveis) : new Date().getFullYear();
                      const novo = maiorAno + 1;
                      setNovoAno(novo);
                      setForm((prev) => ({
                        ...prev,
                        ano: novo,
                        lucro_t1: "",
                        lucro_t2: "",
                        lucro_t3: "",
                        lucro_t4: "",
                        dividendo_por_acao: "",
                        payout_projetado: "",
                        ajuste_dividendo: "",
                        /*preco_atual: "",*/
                        cagr: "",
                        tipo_analise: "",
                        ajuste_motivo: "",
                        vantagens: "",
                        desvantagens: "",
                      }));
                    } else {
                      setNovoAno(null);
                      handleAnoChange({ target: { value: e.target.value } });
                    }
                  }}
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:ring focus:border-blue-500"
                >
                  <option value="novo">+ Novo Ano</option>
                  {anosDisponiveis.map((ano) => (
                    <option
                      key={ano}
                      value={ano}
                      /*className={ano === ultimoAnoSalvo ? "bg-green-100 font-semibold" : ""}*/
                    >
                      {ano}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Campos financeiros e complementares */}
            {[
              ["lucro_t1", "Lucro T1"],
              ["lucro_t2", "Lucro T2"],
              ["lucro_t3", "Lucro T3"],
              ["lucro_t4", "Lucro T4"],
              ["dividendo_por_acao", "Dividendo pago por Ação - Ano Anterior"],
              ["payout_projetado", "Payout Projetado"],
              ["ajuste_dividendo", "Ajuste no Dividendo"],
              /*["preco_atual", "Preço Atual"],*/
              ["cagr", "CAGR (5 anos)"],
              ["tipo_analise", "Tipo de Análise"],
              ["ajuste_motivo", "Motivo do Ajuste"],
              ["vantagens", "Vantagens"],
              ["desvantagens", "Desvantagens"]
            ].map(([name, label]) => (
              <div key={name}>
                <label htmlFor={name} className="block mb-1 font-medium text-gray-700">{label}</label>
                <input id={name} name={name} value={form[name]} onChange={handleChange} onBlur={handleAutoSave}
                  placeholder={label} className="w-full border border-gray-300 px-3 py-2 rounded focus:ring focus:border-blue-500" />
              </div>
            ))}

            {/* Botões de ação */}
            <div className="col-span-1 md:col-span-2 flex justify-end space-x-3 pt-4">
              {anosDisponiveis.includes(Number(form.ano)) && (
                <button
                  type="button"
                  onClick={handleExcluirAno}
                  className="mt-1 text-red-600 hover:underline text-sm"
                >
                  🗑️ Excluir dados deste ano
                </button>
              )}
              <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:underline">Cancelar</button>
              <button type="submit" disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-150">
                {loading ? "Salvando..." : "Salvar"}
              </button>

            </div>
          </form>

        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
