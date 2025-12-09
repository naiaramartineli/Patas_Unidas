import React, { memo } from 'react';
import PropTypes from 'prop-types';
import mulherComCachorro from '../../assets/mulherComCachorro.png';
import './quemSomos.css';

// Componente de imagem
const QuemSomosImage = ({ src, alt, className = "" }) => (
  <div className="quem-somos-img">
    <img 
      src={src} 
      alt={alt} 
      className={className}
      loading="lazy"
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = "/placeholder-about.jpg";
      }}
    />
  </div>
);

QuemSomosImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  className: PropTypes.string,
};

// Componente de texto
const QuemSomosText = ({ 
  title = "Quem somos nós?",
  paragraphs,
  variant = "default",
  className = "",
}) => (
  <div className={`quem-somos-texto quem-somos-texto--${variant} ${className}`.trim()}>
    <h2>{title}</h2>
    {paragraphs.map((paragraph, index) => (
      <p key={index}>{paragraph}</p>
    ))}
  </div>
);

QuemSomosText.propTypes = {
  title: PropTypes.string,
  paragraphs: PropTypes.arrayOf(PropTypes.string).isRequired,
  variant: PropTypes.oneOf(["default", "compact", "expanded"]),
  className: PropTypes.string,
};

QuemSomosText.defaultProps = {
  title: "Quem somos nós?",
  variant: "default",
  className: "",
};

// Dados padrão do conteúdo
const defaultContent = {
  image: mulherComCachorro,
  imageAlt: "Mulher com cachorro",
  title: "Quem somos nós?",
  paragraphs: [
    "A UPA (União Protetora dos Animais) de Lorena é uma associação dedicada ao resgate e proteção de cachorros em situação de abandono ou maus-tratos. O grupo atua acolhendo, tratando e buscando novos lares para os animais, além de promover campanhas de conscientização sobre a importância da adoção responsável e dos cuidados necessários para garantir o bem-estar dos bichinhos.",
    "Com a ajuda de voluntários e doações da comunidade, a UPA trabalha diariamente para oferecer uma vida digna e cheia de carinho para os cachorros resgatados."
  ]
};

// Componente principal QuemSomos
function QuemSomos({ 
  content = defaultContent,
  layout = "image-left",
  variant = "default",
  showImage = true,
  className = "",
}) {
  return (
    <section className={`quem-somos-section quem-somos--${variant} quem-somos--${layout} ${className}`.trim()}>
      <div className="quem-somos-content">
        {layout === "image-left" && showImage && (
          <QuemSomosImage 
            src={content.image} 
            alt={content.imageAlt}
          />
        )}
        
        <QuemSomosText 
          title={content.title}
          paragraphs={content.paragraphs}
          variant={variant}
        />
        
        {layout === "image-right" && showImage && (
          <QuemSomosImage 
            src={content.image} 
            alt={content.imageAlt}
          />
        )}
      </div>
    </section>
  );
}

// Versão memoizada
export const MemoizedQuemSomos = memo(QuemSomos);

// Versão simplificada
export const SimpleQuemSomos = memo(() => {
  return (
    <section className="quem-somos-section">
      <div className="quem-somos-content">
        <div className="quem-somos-img">
          <img 
            src={mulherComCachorro} 
            alt="Mulher com cachorro" 
            loading="lazy"
          />
        </div>

        <div className="quem-somos-texto">
          <h2>Quem somos nós?</h2>
          <p>
            A UPA (União Protetora dos Animais) de Lorena é uma associação dedicada ao resgate
            e proteção de cachorros em situação de abandono ou maus-tratos. O grupo atua acolhendo,
            tratando e buscando novos lares para os animais, além de promover campanhas de conscientização
            sobre a importância da adoção responsável e dos cuidados necessários para garantir o bem-estar
            dos bichinhos.
            <br /><br />
            Com a ajuda de voluntários e doações da comunidade, a UPA trabalha diariamente para oferecer
            uma vida digna e cheia de carinho para os cachorros resgatados.
          </p>
        </div>
      </div>
    </section>
  );
});

SimpleQuemSomos.displayName = 'SimpleQuemSomos';

QuemSomos.propTypes = {
  content: PropTypes.shape({
    image: PropTypes.string.isRequired,
    imageAlt: PropTypes.string,
    title: PropTypes.string,
    paragraphs: PropTypes.arrayOf(PropTypes.string).isRequired,
  }),
  layout: PropTypes.oneOf(["image-left", "image-right", "text-only"]),
  variant: PropTypes.oneOf(["default", "compact", "expanded", "highlight"]),
  showImage: PropTypes.bool,
  className: PropTypes.string,
};

QuemSomos.defaultProps = {
  content: defaultContent,
  layout: "image-left",
  variant: "default",
  showImage: true,
  className: "",
};

export default QuemSomos;