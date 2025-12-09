import React from "react";
import PropTypes from "prop-types";
import "./CardSection.css";

import iconApadrinhe from "../../assets/icon-apadrinhe.png";
import iconAdote from "../../assets/icon-adote.png";
import iconDoacao from "../../assets/icon-doacao.png";

// Dados padrão dos cards
const defaultCardsData = [
  {
    imgSrc: iconApadrinhe,
    altText: "Apadrinhe um animal",
    title: "Apadrinhe um animal!",
    description:
      "Nem sempre podemos adotar, mas sempre podemos mudar uma vida. No apadrinhamento da UPA, você escolhe um dos cãezinhos resgatados para ajudar com os custos de alimentação, vacinas, remédios e cuidados diários. Seu apoio garante mais conforto e saúde enquanto eles esperam por uma família definitiva. Com um gesto simples, você faz parte da história de superação de um amigo de quatro patas. Apadrinhe e transforme vidas!",
    variant: "apadrinhe"
  },
  {
    imgSrc: iconAdote,
    altText: "Adote seu melhor amigo",
    title: "Adote seu melhor amigo!",
    description:
      "Adotar é um ato de amor que transforma vidas. Na UPA, muitos cãezinhos esperam por uma família para chamar de sua. Cada adoção é uma nova história de esperança, carinho e amizade verdadeira. Dê uma nova chance a quem só precisa de amor. Adote!",
    variant: "adote"
  },
  {
    imgSrc: iconDoacao,
    altText: "Nos ajude fazendo uma doação",
    title: "Doe e faça história",
    description:
      "Cada vida importa. Na UPA de Lorena, centenas de animais resgatados esperam por amor, cuidado e uma nova chance. Sua doação é mais do que alimento ou remédio — é esperança para quem já sofreu demais. Com um pequeno gesto, você pode transformar a dor em alegria e dar a esses animais o futuro que eles merecem. Doe e seja a luz no caminho deles!",
    variant: "doacao"
  },
];

// Componente individual de Card Home
const HomeCard = ({ 
  imgSrc, 
  altText, 
  title, 
  description, 
  variant,
  isThird = false 
}) => {
  return (
    <div className={`cardHome cardHome--${variant}`}>
      <div className="cardHome-img-container">
        <img
          src={imgSrc}
          alt={altText}
          className={isThird ? "ajustar-img-terceira" : ""}
          loading="lazy"
        />
      </div>

      <p className="card-title">{title}</p>

      <div className="textoCardHover">
        <span className="hover-text">{description}</span>
      </div>
    </div>
  );
};

HomeCard.propTypes = {
  imgSrc: PropTypes.string.isRequired,
  altText: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  variant: PropTypes.string,
  isThird: PropTypes.bool,
};

HomeCard.defaultProps = {
  variant: "default",
  isThird: false,
};

// Componente principal CardsSection
export default function CardsSection({ 
  customCards,
  layout = "grid",
  maxCards = 3 
}) {
  const cardsToRender = customCards || defaultCardsData;
  
  // Limita o número de cards se necessário
  const limitedCards = cardsToRender.slice(0, maxCards);

  return (
    <div className={`cardsHome cardsHome--${layout}`}>
      {limitedCards.map((card, index) => (
        <HomeCard
          key={card.variant || index}
          imgSrc={card.imgSrc}
          altText={card.altText}
          title={card.title}
          description={card.description}
          variant={card.variant}
          isThird={index === 2}
        />
      ))}
    </div>
  );
}

// Componente individual para uso fora da seção
export { HomeCard };

CardsSection.propTypes = {
  customCards: PropTypes.arrayOf(
    PropTypes.shape({
      imgSrc: PropTypes.string.isRequired,
      altText: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      variant: PropTypes.string,
    })
  ),
  layout: PropTypes.oneOf(["grid", "flex", "carousel"]),
  maxCards: PropTypes.number,
};

CardsSection.defaultProps = {
  layout: "grid",
  maxCards: 3,
};