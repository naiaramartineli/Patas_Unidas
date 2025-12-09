import React, { useState, useEffect, useRef, useCallback } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import "./Header.css";

// Constantes para roles (evita "magic strings")
const ROLES = {
  USER: "user",
  ADMIN: "admin",
  GUEST: null
};

// Hook personalizado para gerenciar role do usuário
const useUserRole = () => {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = () => {
      try {
        // Tenta obter a role de várias fontes possíveis
        const roleSources = [
          () => JSON.parse(localStorage.getItem("currentUser"))?.role,
          () => JSON.parse(localStorage.getItem("userData"))?.role,
          () => JSON.parse(localStorage.getItem("authUser"))?.user?.role
        ];

        let userRole = null;
        
        for (const source of roleSources) {
          try {
            const sourceRole = source();
            if (sourceRole) {
              userRole = String(sourceRole).toLowerCase();
              break;
            }
          } catch (error) {
            continue;
          }
        }

        setRole(userRole);
      } catch (error) {
        console.error("Erro ao carregar role:", error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
    
    // Listener para mudanças no localStorage (opcional)
    const handleStorageChange = () => {
      fetchRole();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return { role, loading };
};

// Componente para o dropdown do perfil
const ProfileDropdown = ({ role, onLogout, onLinkClick, dropdownRef, isOpen, onToggle }) => {
  const userDropdownItems = [
    { to: "/perfil", label: "Minha conta" },
    { to: "/visualiza-adocoes", label: "Minhas Adoções" },
    { to: "/visualiza-doacoes", label: "Minhas Doações" },
  ];

  const adminDropdownItems = [
    { to: "/cadastro-cachorro", label: "Cadastro Animal" },
    { to: "/cadastro-vacinas", label: "Vacinas" },
    { to: "/cadastro-racas", label: "Raças" },
    { to: "/cadastro-admin", label: "Administradores" },
    { to: "/questionario", label: "Pedido de Adoção" },
  ];

  const dropdownItems = role === ROLES.ADMIN ? adminDropdownItems : userDropdownItems;
  const dropdownLabel = role === ROLES.ADMIN ? "Admin ▾" : "Meu Perfil ▾";

  return (
    <div className="menu-perfil" ref={dropdownRef}>
      <button 
        className="dropdown-toggle" 
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {dropdownLabel}
      </button>

      {isOpen && (
        <div className="dropdown" role="menu">
          {dropdownItems.map((item) => (
            <NavLink 
              key={item.to} 
              to={item.to} 
              onClick={onLinkClick}
              role="menuitem"
            >
              {item.label}
            </NavLink>
          ))}
          <button 
            onClick={onLogout}
            className="logout-button"
            role="menuitem"
          >
            Sair
          </button>
        </div>
      )}
    </div>
  );
};

// Componente para navegação principal
const Navigation = ({ role, menuOpen, onLinkClick, dropdownProps }) => {
  // Links comuns a todos os usuários logados
  const commonLinks = [
    { to: "/home", label: "Home", roles: [ROLES.USER, ROLES.ADMIN] },
    { to: "/vitrine-user", label: "Vitrine", roles: [ROLES.USER] },
    { to: "/vitrine-adm", label: "Vitrine", roles: [ROLES.ADMIN] },
    { to: "/adocao", label: "Adoção", roles: [ROLES.USER] },
    { to: "/pagamento", label: "Doações", roles: [ROLES.USER] },
    { to: "/relatorioDoacao", label: "Relatórios", roles: [ROLES.ADMIN] },
  ];

  // Links para visitantes
  const guestLinks = [
    { to: "/", label: "Home" },
    { to: "/register", label: "Cadastre-se" },
    { to: "/login", label: "Entrar" },
  ];

  const getLinks = () => {
    if (!role) return guestLinks;
    
    return commonLinks.filter(link => 
      link.roles.includes(role) || link.roles.includes(role?.toLowerCase())
    );
  };

  const links = getLinks();

  return (
    <nav className={`nav ${menuOpen ? "open" : ""}`} role="navigation">
      {links.map((link) => (
        <NavLink 
          key={link.to} 
          to={link.to} 
          onClick={onLinkClick}
          className={({ isActive }) => isActive ? "active" : ""}
        >
          {link.label}
        </NavLink>
      ))}
      
      {role && <ProfileDropdown {...dropdownProps} />}
    </nav>
  );
};

// Componente principal Header
export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const { role, loading } = useUserRole();

  const toggleMenu = useCallback(() => setMenuOpen(prev => !prev), []);
  const toggleDropdown = useCallback((e) => {
    e.preventDefault();
    setDropdownOpen(prev => !prev);
  }, []);

  const handleLinkClick = useCallback(() => {
    setMenuOpen(false);
    setDropdownOpen(false);
  }, []);

  const handleLogout = useCallback(() => {
    // Limpa apenas os dados de autenticação
    const itemsToKeep = ['theme', 'language']; // Itens que você quer manter
    const allItems = Object.keys(localStorage);
    
    allItems.forEach(key => {
      if (!itemsToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
    
    sessionStorage.clear();
    navigate("/login", { replace: true });
  }, [navigate]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fechar menu ao navegar
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Mostrar loading state
  if (loading) {
    return (
      <header className="header header-loading">
        <div className="header-left">
          <img src={logo} className="logo" alt="Logo Patas Unidas" />
          <span className="company">Carregando...</span>
        </div>
      </header>
    );
  }

  // Determinar título baseado na role
  const getHeaderTitle = () => {
    switch(role) {
      case ROLES.ADMIN:
        return "Painel Administrativo";
      case ROLES.USER:
        return "Patas Unidas";
      default:
        return "Patas Unidas";
    }
  };

  const isAdmin = role === ROLES.ADMIN;

  return (
    <header className={`header ${isAdmin ? "header-adm" : ""}`}>
      <div className="header-left">
        <img src={logo} className="logo" alt="Logo Patas Unidas" />
        <span className="company">{getHeaderTitle()}</span>
      </div>

      <Navigation 
        role={role}
        menuOpen={menuOpen}
        onLinkClick={handleLinkClick}
        dropdownProps={{
          role,
          onLogout: handleLogout,
          onLinkClick: handleLinkClick,
          dropdownRef,
          isOpen: dropdownOpen,
          onToggle: toggleDropdown
        }}
      />

      <button 
        className="menu-toggle" 
        onClick={toggleMenu}
        aria-label="Abrir menu"
        aria-expanded={menuOpen}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {menuOpen && (
        <div 
          className="overlay" 
          onClick={toggleMenu}
          aria-label="Fechar menu"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && toggleMenu()}
        ></div>
      )}
    </header>
  );
}