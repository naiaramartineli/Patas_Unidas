import React from "react";
import PropTypes from "prop-types";
import "./card.css";

// Componente de imagem do card com lazy loading
const CardImage = ({ src, alt, className = "" }) => (
  <img
    src={src}
    alt={alt}
    className={`card-img ${className}`.trim()}
    loading="lazy"
    onError={(e) => {
      e.target.onerror = null;
      e.target.src = "/placeholder-image.jpg"; // Fallback image
    }}
  />
);

CardImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string,
  className: PropTypes.string,
};

CardImage.defaultProps = {
  alt: "Imagem do card",
  className: "",
};

// Componente de botão do card
const CardButton = ({ text, onClick, disabled = false }) => (
  <button 
    className="card-button2" 
    onClick={onClick}
    disabled={disabled}
    aria-label={text}
  >
    {text}
  </button>
);

CardButton.propTypes = {
  text: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
};

// Componente principal Card
export default function Card({
  titulo,
  descricao,
  img,
  textoBotao,
  onClick,
  classImg = "",
  disabled = false,
  loading = false,
  children, // Para conteúdo adicional
}) {
    
  // Truncar descrição se for muito longa
  const truncateDescription = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  return (
    <div className={`card-pagamento ${loading ? 'card-loading' : ''}`}>
      <div className="card-header">
        <h2 className="card-title">{titulo}</h2>
      </div>
      
      <div className="card-body">
        <p className="card-description">
          {truncateDescription(descricao)}
        </p>
        
        <CardImage 
          src={img} 
          alt={titulo} 
          className={classImg} 
        />
        
        {/* Slot para conteúdo adicional */}
        {children && (
          <div className="card-content">
            {children}
          </div>
        )}
      </div>
      
      <div className="card-footer">
        <CardButton 
          text={textoBotao} 
          onClick={onClick} 
          disabled={disabled || loading}
        />
        
        {/* Indicador de loading */}
        {loading && (
          <div className="card-loading-indicator">
            Carregando...
          </div>
        )}
      </div>
    </div>
  );
}

// Versão simplificada do Card (caso precise de uma versão mais básica)
export const SimpleCard = ({
  titulo,
  descricao,
  img,
  textoBotao,
  onClick,
  classImg = "",
}) => (
  <div className="card-pagamento">
    <h2>{titulo}</h2>
    <p>{descricao}</p>
    <img
      src={img}
      alt={titulo}
      className={`card-img ${classImg}`.trim()}
    />
    <button className="card-button2" onClick={onClick}>
      {textoBotao}
    </button>
  </div>
);

// Tipagem com PropTypes
Card.propTypes = {
  titulo: PropTypes.string.isRequired,
  descricao: PropTypes.string.isRequired,
  img: PropTypes.string.isRequired,
  textoBotao: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  classImg: PropTypes.string,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  children: PropTypes.node,
};

SimpleCard.propTypes = {
  titulo: PropTypes.string.isRequired,
  descricao: PropTypes.string.isRequired,
  img: PropTypes.string.isRequired,
  textoBotao: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  classImg: PropTypes.string,
};

// Valores padrão
Card.defaultProps = {
  classImg: "",
  disabled: false,
  loading: false,
  onClick: () => {},
};

SimpleCard.defaultProps = {
  classImg: "",
  onClick: () => {},
};