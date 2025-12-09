// frontend/src/routes/appRoutes.js
import { BrowserRouter, Routes, Route } from "react-router-dom";

/* ========= PÁGINAS PÚBLICAS ========= */
import TelaInicial from "../pages/tela-Inicial/TelaInicial";
import Login from "../pages/login/login";
import Register from "../pages/register/FormPage";
import AboutUs from "../pages/aboutUs/AboutUs";

/* ========= PÁGINAS DO USUÁRIO ========= */
// Importando da nova estrutura de pastas
import HomeUsuario from "../pages/pagesUser/home/Home";
import Pagamento from "../pages/pagesUser/pagamento/Pagamento";
import PerfilUsuario from "../pages/pagesUser/perfilUsuario/PerfilUsuario";
import ConfiguracoesPerfil from "../pages/pagesUser/configPerfil/ConfiguracoesPerfil";
import VitrineUsuario from "../pages/pagesUser/vitrineUsuario/VitrineUsuario";

/* ========= DOAÇÃO E APADRINHAMENTO ========= */
import Doacao from "../pages/pagesUser/doacao/Doacao";
import Apadrinhamento from "../pages/pagesUser/apadrinhamento/Apadrinhamento";
import PagamentoPix from "../pages/pagesUser/pagamentoPix/PagamentoPix";
import Adocao from "../pages/pagesUser/adocao/Adocao"; // Página específica de adoção

/* ========= VISUALIZAÇÃO DE HISTÓRICO ========= */
import VisualizaAdocoes from "../pages/pagesUser/visualizaAdocao/VisualizaAdocoes";
import VisualizaApadrinhamento from "../pages/pagesUser/visualizaApadrinhamento/VisualizaApadrinhamento";
import VisualizaDoacoes from "../pages/pagesUser/visualizaDoacoes/VisualizaDoacoes";

/* ========= PÁGINAS ADMIN ========= */
import HomeAdm from "../admPages/HomeAdm/HomeAdm";
import CadastroAdmin from "../admPages/CadastroAdmin/CadastroAdmin";
import CadastroCachorro from "../admPages/cadastroCachorro/cadastroCachorro";
import CadastroRacas from "../admPages/CadastroRacas/CadastroRacas";
import CadastroVacinas from "../admPages/CadastroVacinas/CadastroVacinas";
import Questionario from "../admPages/Questionario/Questionario";
import VitrineAdm from "../admPages/vitrineADM/VitrineADM";

/* ========= ROTAS PROTEGIDAS ========= */
import PrivateRoute from "./privateRoute";
import AdminRoute from "./adminRoutes";

/* ========= COMPONENTES DE ERRO ========= */
import NotFound from "../components/notFound/NotFound";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ========= ROTAS PÚBLICAS ========= */}
        <Route path="/" element={<TelaInicial />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/sobre-nos" element={<AboutUs />} />
        
        {/* ========= ROTAS AUTENTICADAS (USUÁRIO) ========= */}
        <Route path="/home" element={<PrivateRoute><HomeUsuario /></PrivateRoute>} />
        
        {/* Pagamento e Doações */}
        <Route path="/pagamento" element={<PrivateRoute><Pagamento /></PrivateRoute>} />
        <Route path="/pagamento-pix" element={<PrivateRoute><PagamentoPix /></PrivateRoute>} />
        <Route path="/doacao" element={<PrivateRoute><Doacao /></PrivateRoute>} />
        
        {/* Adoção e Apadrinhamento */}
        <Route path="/adocao" element={<PrivateRoute><Adocao /></PrivateRoute>} />
        <Route path="/apadrinhamento" element={<PrivateRoute><Apadrinhamento /></PrivateRoute>} />
        <Route path="/apadrinhamento/:id" element={<PrivateRoute><Apadrinhamento /></PrivateRoute>} />
        
        {/* Perfil e Configurações */}
        <Route path="/perfil" element={<PrivateRoute><PerfilUsuario /></PrivateRoute>} />
        <Route path="/configuracoes" element={<PrivateRoute><ConfiguracoesPerfil /></PrivateRoute>} />
        
        {/* Vitrine */}
        <Route path="/vitrine-user" element={<PrivateRoute><VitrineUsuario /></PrivateRoute>} />
        
        {/* Visualização de Histórico */}
        <Route path="/visualiza-adocoes" element={<PrivateRoute><VisualizaAdocoes /></PrivateRoute>} />
        <Route path="/visualiza-apadrinhamento" element={<PrivateRoute><VisualizaApadrinhamento /></PrivateRoute>} />
        <Route path="/visualiza-doacoes" element={<PrivateRoute><VisualizaDoacoes /></PrivateRoute>} />
        <Route path="/relatorio-apadrinhamento/:id" element={<PrivateRoute><div>Relatório Apadrinhamento (Em desenvolvimento)</div></PrivateRoute>} />
        
        {/* ========= ROTAS ADMIN ========= */}
        <Route path="/home-adm" element={<AdminRoute><HomeAdm /></AdminRoute>} />
        <Route path="/cadastro-admin" element={<AdminRoute><CadastroAdmin /></AdminRoute>} />
        <Route path="/cadastro-cachorro" element={<AdminRoute><CadastroCachorro /></AdminRoute>} />
        <Route path="/cadastro-racas" element={<AdminRoute><CadastroRacas /></AdminRoute>} />
        <Route path="/cadastro-vacinas" element={<AdminRoute><CadastroVacinas /></AdminRoute>} />
        <Route path="/questionario" element={<AdminRoute><Questionario /></AdminRoute>} />
        <Route path="/vitrine-adm" element={<AdminRoute><VitrineAdm /></AdminRoute>} />
        
        {/* ========= ROTAS DE REDIRECIONAMENTO ========= */}
        <Route path="/vitrine" element={<PrivateRoute><Navigate to="/vitrine-user" replace /></PrivateRoute>} />
        <Route path="/apadrinhe" element={<PrivateRoute><Navigate to="/apadrinhamento" replace /></PrivateRoute>} />
        <Route path="/doe" element={<PrivateRoute><Navigate to="/doacao" replace /></PrivateRoute>} />
        
        {/* ========= ROTA 404 ========= */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}