import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function GraficoDividendos({ dados }) {
  const chartData = dados.map((d) => ({
    ano: d.ano,
    dividendo: d.dividendo_por_acao,
    payout: d.payout_projetado * 100,
  }));

  return (
    <div>
      <h4 className="font-semibold mb-2">💸 Dividendos vs Payout</h4>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <XAxis dataKey="ano" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="dividendo" fill="#8884d8" name="Dividendo/Ação" />
          <Bar dataKey="payout" fill="#82ca9d" name="Payout (%)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
