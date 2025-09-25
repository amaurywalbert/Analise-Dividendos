export default function TabelaFinanceira({ dados }) {
  return (
    <table className="w-full text-sm border">
      <thead className="bg-gray-200">
        <tr>
          <th>Ano</th> 
          <th>Lucro (mil)</th>
          <th>LPA</th>
          <th>Div Ano Anterior</th>
          <th>LPA E*</th>
          <th>Payout E*</th>
          <th>Div E*</th>
          <th>CAGR (5 anos)</th>
          <th>Ajuste Dividendo</th>
          <th>Variação YoY</th>
          <th>Crescimento Lucro E*</th>
          <th>Yield E*</th>
          <th>Preço Teto</th>
        </tr>
      </thead>
      <tbody>
        {dados.map((d) => (
          <tr key={d.ano} className="text-center border-t">
            <td>{d.ano}</td>
            <td>R$ {(d.lucro_liquido_anual/1000).toLocaleString()}</td>
            <td>{d.lpa.toFixed(2)}</td>
            <td>R$ {d.dividendo_por_acao.toFixed(2)}</td>
            <td>R$ {d.lpa_estimada.toFixed(2)}</td>
            <td>{(d.payout_projetado * 100).toFixed(0)}%</td>
            <td>R$ {d.dividendo_projetado_calc.toFixed(2)}</td>
            <td>{(d.cagr * 100).toFixed(0)}%</td>
            <td>{(d.ajuste_dividendo * 100).toFixed(0)}%</td>
            <td>{(d.variacao_yoy * 100).toFixed(2)}%</td>
            <td>{(d.crescimento_estimado_lucro * 100).toFixed(2)}%</td>
            <td>{(d.yield_projetado * 100).toFixed(2)}%</td>
            <td>R$ {d.preco_teto.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
