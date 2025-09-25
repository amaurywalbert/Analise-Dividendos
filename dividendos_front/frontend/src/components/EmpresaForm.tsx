import { useState } from "react";
import axios from "axios";

export default function EmpresaForm() {
  const [form, setForm] = useState({
    nome: "",
    ticker: "",
    numero_acoes: "",
  });

  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        nome: form.nome.trim(),
        ticker: form.ticker.trim().toUpperCase(),
        numero_acoes: parseInt(form.numero_acoes),
      };

      const res = await axios.post("http://localhost:8000/empresas", payload);
      setStatus(`✅ Empresa cadastrada! ID: ${res.data.id}`);
      setForm({ nome: "", ticker: "", numero_acoes: "" });
    } catch (err: any) {
      setStatus("❌ Erro ao cadastrar empresa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center">Cadastrar Empresa</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="nome"
          placeholder="Nome"
          value={form.nome}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
        <input
          name="ticker"
          placeholder="Ticker"
          value={form.ticker}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 rounded px-3 py-2 uppercase"
        />
        <input
          name="numero_acoes"
          type="number"
          placeholder="Número de Ações"
          value={form.numero_acoes}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Enviando..." : "Salvar"}
        </button>
      </form>
      {status && (
        <p className="mt-4 text-center text-sm text-gray-700">{status}</p>
      )}
    </div>
  );
}
