import React from "react";
import PropTypes from "prop-types";
import "./CardInfo.css";

// Componente de imagem do CardInfo
const InfoImage = ({ src, alt, title }) => (
  <img
    src={src}
    alt={alt}
    title={title}
    loading="lazy"
    onError={(e) => {
      e.target.onerror = null;
      e.target.src = "/placeholder-info.jpg";
    }}
  />
);

InfoImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string,
  title: PropTypes.string,
};

InfoImage.defaultProps = {
  alt: "Imagem informativa",
  title: "",
};

// Componente principal CardInfo
export default function CardInfo({ 
  title, 
  text, 
  image, 
  imageAlt,
  variant = "default",
  children 
}) {
  return (
    <div className={`card-info card-info--${variant}`}>
      <div className="card-info-header">
        <h3 className="card-info-title">{title}</h3>
      </div>
      
      <div className="card-info-content">
        <p className="card-info-text">{text}</p>
        
        <div className="card-info-image-container">
          <InfoImage 
            src={image} 
            alt={imageAlt || title} 
            title={title}
          />
        </div>
        
        {children && (
          <div className="card-info-extra">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

// Versão minimalista do CardInfo
export const SimpleCardInfo = ({ title, text, image }) => (
  <div className="card-info">
    <h3>{title}</h3>
    <p>{text}</p>
    <img src={image} alt={title || "Imagem"} />
  </div>
);

CardInfo.propTypes = {
  title: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  image: PropTypes.string.isRequired,
  imageAlt: PropTypes.string,
  variant: PropTypes.oneOf(["default", "featured", "compact"]),
  children: PropTypes.node,
};

SimpleCardInfo.propTypes = {
  title: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  image: PropTypes.string.isRequired,
};

CardInfo.defaultProps = {
  variant: "default",
  imageAlt: "",
};