import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function GraficoCrescimento({ dados }) {
  const chartData = dados.map((d) => ({
    ano: d.ano,
    CAGR: d.cagr ? (d.cagr * 100).toFixed(2) : null,
    crescimento: d.crescimento_estimado_lucro ? (d.crescimento_estimado_lucro * 100).toFixed(2) : null,
  }));

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">📊 CAGR vs Crescimento de Lucros</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <XAxis dataKey="ano" />
          <YAxis unit="%" />
          <Tooltip />
          <Legend />
          <Bar dataKey="CAGR" fill="#facc15" name="CAGR (%)" />
          <Bar dataKey="crescimento" fill="#f87171" name="Cresc. Lucros (%)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
