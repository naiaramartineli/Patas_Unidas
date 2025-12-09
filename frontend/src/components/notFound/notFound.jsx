// frontend/src/components/NotFound/NotFound.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../Header/Header';
import Footer from '../footer/footer';
import PatasAleatorias from '../patas/PatasAleatorias';
import './notFound.css';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="notfound-wrapper">
      <Header />
      
      <div className="notfound-patinhas">
        <PatasAleatorias quantidade={30} />
      </div>

      <main className="notfound-container">
        <div className="notfound-content">
          <div className="notfound-error-code">
            <h1>404</h1>
            <div className="dog-icon">🐕</div>
          </div>
          
          <h2>Ops! Página não encontrada</h2>
          
          <p className="notfound-message">
            Parece que nosso amiguinho de quatro patas levou essa página para passear! 
            Ela pode ter sido movida, removida ou talvez nunca tenha existido.
          </p>

          <div className="notfound-actions">
            <button 
              onClick={() => navigate(-1)} 
              className="btn-voltar"
            >
              Voltar
            </button>
            
            <button 
              onClick={() => navigate('/home')} 
              className="btn-home"
            >
              Ir para Home
            </button>
            
            <button 
              onClick={() => navigate('/vitrine-user')} 
              className="btn-vitrine"
            >
              Ver Pets
            </button>
          </div>

          <div className="notfound-suggestions">
            <h3>Enquanto isso, que tal:</h3>
            <ul>
              <li onClick={() => navigate('/vitrine-user')}>Conhecer nossos pets para adoção</li>
              <li onClick={() => navigate('/sobre-nos')}>Saber mais sobre nossa ONG</li>
              <li onClick={() => navigate('/pagamento')}>Ajudar nossos amigos com uma doação</li>
              <li onClick={() => navigate('/perfil')}>Acessar seu perfil</li>
            </ul>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}