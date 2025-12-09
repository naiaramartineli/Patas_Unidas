import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import dogImage from '../../assets/dogHero.png';
import './dogSection.css';

// Hook personalizado para obter nome do usuário
const useUserDisplayName = (customName) => {
  return useMemo(() => {
    if (customName) return customName;

    try {
      const stored = localStorage.getItem("userData");
      if (!stored) return "amigo";

      const user = JSON.parse(stored);
      const rawName = user.nomeSocial || 
                     user.nome_social || 
                     user.nome || 
                     user.name || 
                     user.username || 
                     "";

      return rawName.trim().split(" ")[0] || "amigo";
    } catch (err) {
      console.error("Erro ao ler userData:", err);
      return "amigo";
    }
  }, [customName]);
};

// Container de botões da seção
const DogSectionButtons = ({ 
  onCadastroClick, 
  onSobreNosClick,
  cadastroText = "Cadastrar",
  sobreNosText = "Sobre nós",
  variant = "default",
  buttonSize = "medium"
}) => (
  <div className="dogSection-textButtonContainer">
    <button 
      className={`dogSection-button dogSection-button--${variant} dogSection-button--${buttonSize}`}
      onClick={onSobreNosClick}
    >
      {sobreNosText}
    </button>
    <button 
      className={`dogSection-button dogSection-button--primary dogSection-button--${variant} dogSection-button--${buttonSize}`}
      onClick={onCadastroClick}
    >
      {cadastroText}
    </button>
  </div>
);

DogSectionButtons.propTypes = {
  onCadastroClick: PropTypes.func.isRequired,
  onSobreNosClick: PropTypes.func.isRequired,
  cadastroText: PropTypes.string,
  sobreNosText: PropTypes.string,
  variant: PropTypes.oneOf(["default", "outline", "filled"]),
  buttonSize: PropTypes.oneOf(["small", "medium", "large"]),
};

DogSectionButtons.defaultProps = {
  cadastroText: "Cadastrar",
  sobreNosText: "Sobre nós",
  variant: "default",
  buttonSize: "medium",
};

// Imagem do cachorro
const DogImage = ({ src, alt = "Cachorro feliz", className = "" }) => (
  <img 
    src={src} 
    alt={alt} 
    className={`dogSection-image-img ${className}`.trim()}
    loading="eager"
    onError={(e) => {
      e.target.onerror = null;
      e.target.src = "/placeholder-dog.png";
    }}
  />
);

DogImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string,
  className: PropTypes.string,
};

// Componente principal DogSection
function DogSection({
  onCadastroClick,
  onSobreNosClick,
  showButtons = true,
  title,
  nomeUsuario,
  imageSrc = dogImage,
  imageAlt,
  variant = "default",
  align = "left",
  showImage = true,
  customButtons,
  buttonVariant = "default",
  buttonSize = "medium",
  children,
}) {
  const displayName = useUserDisplayName(nomeUsuario);

  // Título padrão se não for fornecido
  const defaultTitle = (
    <>
      Olá {displayName}! <br />
      Estava esperando por você.
    </>
  );

  const finalTitle = title || defaultTitle;

  return (
    <section className={`dogSection-container dogSection--${variant} dogSection--align-${align}`}>
      <div className="dogSection-text">
        <h1 className="dogSection-title">
          {typeof finalTitle === 'string' ? finalTitle : finalTitle}
        </h1>
        
        {children && (
          <div className="dogSection-content">
            {children}
          </div>
        )}
        
        {showButtons && (
          customButtons || (
            <DogSectionButtons
              onCadastroClick={onCadastroClick}
              onSobreNosClick={onSobreNosClick}
              variant={buttonVariant}
              buttonSize={buttonSize}
            />
          )
        )}
      </div>

      {showImage && (
        <div className="dogSection-image">
          <DogImage 
            src={imageSrc} 
            alt={imageAlt || `Cachorro feliz - ${displayName}`}
          />
        </div>
      )}
    </section>
  );
}

// Versão simplificada do DogSection
export const SimpleDogSection = ({
  onCadastroClick,
  onSobreNosClick,
  showButtons = true,
}) => {
  const displayName = useUserDisplayName();

  return (
    <section className="dogSection-container">
      <div className="dogSection-text">
        <h1>
          Olá {displayName}! <br />
          Estava esperando por você.
        </h1>

        {showButtons && (
          <div className="dogSection-textButtonContainer">
            <button onClick={onSobreNosClick}>Sobre nós</button>
            <button onClick={onCadastroClick}>Cadastrar</button>
          </div>
        )}
      </div>

      <div className="dogSection-image">
        <img src={dogImage} alt="Cachorro feliz" />
      </div>
    </section>
  );
};

DogSection.propTypes = {
  onCadastroClick: PropTypes.func.isRequired,
  onSobreNosClick: PropTypes.func.isRequired,
  showButtons: PropTypes.bool,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  nomeUsuario: PropTypes.string,
  imageSrc: PropTypes.string,
  imageAlt: PropTypes.string,
  variant: PropTypes.oneOf(["default", "hero", "compact", "inverted"]),
  align: PropTypes.oneOf(["left", "center", "right"]),
  showImage: PropTypes.bool,
  customButtons: PropTypes.node,
  buttonVariant: PropTypes.oneOf(["default", "outline", "filled"]),
  buttonSize: PropTypes.oneOf(["small", "medium", "large"]),
  children: PropTypes.node,
};

SimpleDogSection.propTypes = {
  onCadastroClick: PropTypes.func.isRequired,
  onSobreNosClick: PropTypes.func.isRequired,
  showButtons: PropTypes.bool,
};

DogSection.defaultProps = {
  showButtons: true,
  imageSrc: dogImage,
  variant: "default",
  align: "left",
  showImage: true,
  buttonVariant: "default",
  buttonSize: "medium",
};

export default DogSection;