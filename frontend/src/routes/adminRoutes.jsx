// frontend/src/routes/adminRoutes.js
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { authService } from "../services/authService";

export default function AdminRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        // Verificar autenticação via serviço
        const response = await authService.verifyAuth();
        
        if (response?.usuario) {
          setUser(response.usuario);
          
          // Verificar se é admin baseado no perfil/permissões
          const role = response.usuario.id_permissao || response.usuario.role || '';
          const isAdminUser = 
            role === 1 || // ID 1 para admin (ajustar conforme seu backend)
            role === 'admin' || 
            role === 'administrador' ||
            response.usuario.isAdmin === true;
          
          setIsAdmin(isAdminUser);
        } else {
          // Fallback para localStorage se necessário
          const stored = localStorage.getItem("userData");
          const parsedUser = stored ? JSON.parse(stored) : null;
          
          if (parsedUser) {
            setUser(parsedUser);
            const role = String(parsedUser.role || "").trim().toLowerCase();
            setIsAdmin(role === "admin" || role === "administrador");
          }
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <p>Verificando permissões...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: window.location.pathname }} />;
  }

  if (!isAdmin) {
    // Registrar tentativa de acesso não autorizado
    console.warn(`Usuário ${user.email} tentou acessar rota admin: ${window.location.pathname}`);
    return <Navigate to="/home" replace />;
  }

  return children;
}