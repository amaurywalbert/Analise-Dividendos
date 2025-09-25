import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ImportadorCSV() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/empresas/importar_csv", {
        method: "POST",
        body: formData,
      });
      //const data = await response.json();
      //setStatus(`Importação concluída: ${data.importados} registros.`);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erro do servidor: ${text}`);
      }
      const data = await response.json();
      setStatus(`Importação concluída: ${data.importados} registros.`);

    } catch (err) {
      console.error(err);
      setStatus("Erro ao importar o arquivo CSV.");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Importar Dados Financeiros (CSV)</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full"
              required
            />
            <Button type="submit" disabled={!file}>
              Enviar CSV
            </Button>
          </form>
          {status && <p className="text-sm text-muted-foreground">{status}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
