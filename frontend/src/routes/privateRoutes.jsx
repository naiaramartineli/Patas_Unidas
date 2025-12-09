// frontend/src/routes/privateRoute.js
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { authService } from "../services/authService";

export default function PrivateRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        // Verificar autenticação via serviço
        const response = await authService.verifyAuth();
        
        if (response?.authenticated || response?.usuario) {
          setIsAuthenticated(true);
          setUser(response.usuario || response.user);
          
          // Atualizar localStorage se necessário
          if (response.usuario && !localStorage.getItem("userData")) {
            localStorage.setItem("userData", JSON.stringify(response.usuario));
          }
          
          // Atualizar userId se estiver disponível
          if (response.usuario?.id && !localStorage.getItem("userId")) {
            localStorage.setItem("userId", response.usuario.id);
          }
        } else {
          // Fallback para verificação de token
          const token = localStorage.getItem("access_token");
          if (token) {
            // Tentar obter perfil para validar token
            try {
              const profile = await authService.getProfile();
              if (profile?.usuario) {
                setIsAuthenticated(true);
                setUser(profile.usuario);
              }
            } catch (profileError) {
              // Token inválido, limpar storage
              localStorage.removeItem("access_token");
              localStorage.removeItem("refresh_token");
              localStorage.removeItem("userData");
              setIsAuthenticated(false);
            }
          } else {
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        setIsAuthenticated(false);
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
        <p>Verificando autenticação...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Salvar a URL atual para redirecionar após login
    const returnUrl = window.location.pathname + window.location.search;
    return <Navigate to="/login" replace state={{ from: returnUrl }} />;
  }

  return children;
}