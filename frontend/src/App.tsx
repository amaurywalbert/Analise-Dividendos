import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import ImportadorCSV from "./pages/ImportadorCSV";
import EmpresaForm from "./components/EmpresaForm";
import EmpresasList from "./components/EmpresasList";
import InformacoesEmpresa from "./components/InformacoesEmpresa";
//import ConfiguracoesGlobais from "./components/ConfiguracoesGlobais";




function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-blue-800 text-white py-4">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <h1 className="text-xl font-bold">💰 Projeção de Preço Teto e Dividendos</h1>
            <nav className="space-x-4">
              <Link to="/" className="hover:underline">Listar Empresas</Link>
              <Link to="/cadastrar" className="hover:underline">Cadastrar Empresa</Link>
              {/*<Link to="/configuracoes" className="hover:underline">Configurações</Link>*/}
              <Link to="/importarCSV" className="hover:underline">Importar CSV</Link>
              
            </nav>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<EmpresasList />} />
            <Route path="/importarCSV" element={<ImportadorCSV />} />
            <Route path="/cadastrar" element={<EmpresaForm />} />
            <Route path="/informacoes/:empresaId" element={<InformacoesEmpresa />} />
            {/*<Route path="/configuracoes" element={<ConfiguracoesGlobais />} />*/}
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;