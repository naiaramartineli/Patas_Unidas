import React from 'react';
import PropTypes from 'prop-types';
import './cardVitrine.css';
import patinhaIcon from '../../assets/patinha.png';

// Componente de imagem da vitrine
const VitrineImage = ({ src, alt, nome }) => (
  <img 
    src={src} 
    alt={alt || `Foto do ${nome}`} 
    className="vitrine-card-img"
    loading="lazy"
    onError={(e) => {
      e.target.onerror = null;
      e.target.src = "/placeholder-animal.jpg";
    }}
  />
);

VitrineImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string,
  nome: PropTypes.string,
};

// Componente de informação do animal
const AnimalInfo = ({ label, value, icon }) => (
  <p className="vitrine-card-info-item">
    {icon && <span className="info-icon">{icon}</span>}
    <span className="info-label">{label}:</span> 
    <span className="info-value">{value}</span>
  </p>
);

AnimalInfo.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  icon: PropTypes.node,
};

// Componente principal CardVitrine
export default function CardVitrine({ 
  data, 
  onSelect, 
  isSelected = false,
  showPatinha = true,
  variant = "default" 
}) {
  const {
    img,
    nome,
    cor,
    porte,
    comportamento,
    idade,
    raca,
    sexo,
    saudavel,
    castrado,
    vacinado
  } = data;

  // Informações básicas que sempre aparecem
  const basicInfo = [
    { label: "Cor", value: cor },
    { label: "Porte", value: porte },
    { label: "Comportamento", value: comportamento },
    { label: "Idade", value: idade },
  ];

  // Informações adicionais para variantes detalhadas
  const extraInfo = variant === "detailed" ? [
    raca && { label: "Raça", value: raca },
    sexo && { label: "Sexo", value: sexo },
    saudavel !== undefined && { label: "Saúde", value: saudavel ? "Saudável" : "Cuidados especiais" },
    castrado !== undefined && { label: "Castrado", value: castrado ? "Sim" : "Não" },
    vacinado !== undefined && { label: "Vacinado", value: vacinado ? "Sim" : "Não" },
  ].filter(Boolean) : [];

  const handleClick = () => {
    if (onSelect) {
      onSelect(data);
    }
  };

  return (
    <div 
      className={`vitrine-card vitrine-card--${variant} ${isSelected ? 'vitrine-card--selected' : ''}`}
      onClick={handleClick}
      role={onSelect ? "button" : "article"}
      tabIndex={onSelect ? 0 : -1}
      onKeyDown={(e) => onSelect && e.key === 'Enter' && handleClick()}
    >
      <VitrineImage src={img} alt={nome} nome={nome} />
      
      <div className="vitrine-card-header">
        <h4 className="vitrine-card-nome">{nome}</h4>
        {showPatinha && (
          <img 
            src={patinhaIcon} 
            alt="Patinha" 
            className="patinha-icon" 
            title="Animal disponível para adoção"
          />
        )}
      </div>
      
      <div className="vitrine-card-info">
        {basicInfo.map((info, index) => (
          <AnimalInfo 
            key={index}
            label={info.label}
            value={info.value}
          />
        ))}
        
        {extraInfo.length > 0 && (
          <div className="vitrine-card-extra-info">
            {extraInfo.map((info, index) => (
              <AnimalInfo 
                key={`extra-${index}`}
                label={info.label}
                value={info.value}
              />
            ))}
          </div>
        )}
      </div>
      
      {onSelect && (
        <div className="vitrine-card-actions">
          <button 
            className="vitrine-card-button"
            onClick={handleClick}
            aria-label={`Ver detalhes de ${nome}`}
          >
            Ver detalhes
          </button>
        </div>
      )}
    </div>
  );
}

// Versão simplificada do CardVitrine
export const SimpleCardVitrine = ({ data }) => (
  <div className="vitrine-card">
    <img src={data.img} alt={data.nome} className="vitrine-card-img" />
    <h4 className="vitrine-card-nome">{data.nome}</h4>
    <div className="vitrine-card-info">
      <p><span className="info-label">Cor:</span> {data.cor}</p>
      <p><span className="info-label">Porte:</span> {data.porte}</p>
      <p><span className="info-label">Comportamento:</span> {data.comportamento}</p>
      <p><span className="info-label">Idade:</span> {data.idade}</p>
    </div>
    <img src={patinhaIcon} alt="Patinha" className="patinha-icon" />
  </div>
);

CardVitrine.propTypes = {
  data: PropTypes.shape({
    img: PropTypes.string.isRequired,
    nome: PropTypes.string.isRequired,
    cor: PropTypes.string.isRequired,
    porte: PropTypes.string.isRequired,
    comportamento: PropTypes.string.isRequired,
    idade: PropTypes.string.isRequired,
    raca: PropTypes.string,
    sexo: PropTypes.string,
    saudavel: PropTypes.bool,
    castrado: PropTypes.bool,
    vacinado: PropTypes.bool,
  }).isRequired,
  onSelect: PropTypes.func,
  isSelected: PropTypes.bool,
  showPatinha: PropTypes.bool,
  variant: PropTypes.oneOf(["default", "detailed", "compact"]),
};

SimpleCardVitrine.propTypes = {
  data: PropTypes.shape({
    img: PropTypes.string.isRequired,
    nome: PropTypes.string.isRequired,
    cor: PropTypes.string.isRequired,
    porte: PropTypes.string.isRequired,
    comportamento: PropTypes.string.isRequired,
    idade: PropTypes.string.isRequired,
  }).isRequired,
};

CardVitrine.defaultProps = {
  variant: "default",
  showPatinha: true,
  isSelected: false,
};