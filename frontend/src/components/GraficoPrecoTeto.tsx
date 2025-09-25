import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function GraficoPrecoTeto({ dados }) {
  const chartData = dados.map((d) => ({
    ano: d.ano,
    precoTeto: d.preco_teto,
    cotacao: d.cotacao_yf,
  }));

  return (
    <div>
      <h4 className="font-semibold mb-2">📏 Preço Teto vs Cotação</h4>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <XAxis dataKey="ano" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="precoTeto" stroke="#8884d8" />
          <Line type="monotone" dataKey="cotacao" stroke="#82ca9d" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
