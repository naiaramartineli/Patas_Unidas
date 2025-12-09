import React, { useMemo, memo } from "react";
import PropTypes from "prop-types";
import patinha from "../../assets/patinha.png";
import "./patasAleatorias.css";

// Componente individual da patinha
const Patinha = ({ 
  index, 
  left, 
  top, 
  delay, 
  size = "medium",
  rotate,
  opacity,
  animationType = "float",
  imageSrc = patinha
}) => {
  const style = {
    left: `${left}%`,
    top: `${top}%`,
    animationDelay: `${delay}s`,
    transform: rotate ? `rotate(${rotate}deg)` : undefined,
    opacity: opacity !== undefined ? opacity : 1,
  };

  return (
    <img
      key={index}
      src={imageSrc}
      alt="Patinha"
      className={`pata pata--${size} pata--${animationType}`}
      style={style}
      loading="lazy"
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = "/placeholder-paw.png";
      }}
    />
  );
};

Patinha.propTypes = {
  index: PropTypes.number.isRequired,
  left: PropTypes.number.isRequired,
  top: PropTypes.number.isRequired,
  delay: PropTypes.number.isRequired,
  size: PropTypes.oneOf(["small", "medium", "large"]),
  rotate: PropTypes.number,
  opacity: PropTypes.number,
  animationType: PropTypes.oneOf(["float", "pulse", "spin", "none"]),
  imageSrc: PropTypes.string,
};

Patinha.defaultProps = {
  size: "medium",
  animationType: "float",
  imageSrc: patinha,
};

// Hook para gerar posições das patinhas
const usePatinhasPositions = ({
  quantidade = 20,
  minDistance = 15,
  maxAttempts = 100,
  bounds = { width: 100, height: 100 }
}) => {
  return useMemo(() => {
    const positions = [];
    const patinhas = [];

    const calculateDistance = (x1, y1, x2, y2) =>
      Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);

    for (let i = 0; i < quantidade; i++) {
      let left, top, attempts = 0;
      let positionFound = false;

      do {
        left = Math.random() * bounds.width;
        top = Math.random() * bounds.height;
        attempts++;

        // Verifica se está longe o suficiente de outras patinhas
        const tooClose = positions.some(([x, y]) => 
          calculateDistance(left, top, x, y) < minDistance
        );

        if (!tooClose || attempts > maxAttempts) {
          positionFound = true;
        }
      } while (!positionFound && attempts <= maxAttempts);

      if (positionFound) {
        positions.push([left, top]);
        
        patinhas.push({
          id: i,
          left,
          top,
          delay: Math.random() * 5,
          rotate: Math.random() * 360,
          opacity: 0.3 + Math.random() * 0.7,
          size: ["small", "medium", "large"][Math.floor(Math.random() * 3)],
          animationType: ["float", "pulse", "spin"][Math.floor(Math.random() * 3)],
        });
      }
    }

    return patinhas;
  }, [quantidade, minDistance, maxAttempts, bounds.width, bounds.height]);
};

// Componente principal PatasAleatorias
function PatasAleatorias({ 
  quantidade = 20,
  minDistance = 15,
  maxAttempts = 100,
  bounds = { width: 100, height: 100 },
  customImage,
  animationEnabled = true,
  className = "",
}) {
  const patinhas = usePatinhasPositions({
    quantidade,
    minDistance,
    maxAttempts,
    bounds
  });

  return (
    <div className={`patas-container ${className}`.trim()}>
      {patinhas.map((pata) => (
        <Patinha
          key={pata.id}
          index={pata.id}
          left={pata.left}
          top={pata.top}
          delay={pata.delay}
          size={pata.size}
          rotate={pata.rotate}
          opacity={pata.opacity}
          animationType={animationEnabled ? pata.animationType : "none"}
          imageSrc={customImage || patinha}
        />
      ))}
    </div>
  );
}

// Versão otimizada para memoização
export const MemoizedPatasAleatorias = memo(PatasAleatorias);

// Versão controlada (posições fixas)
export const PatasControladas = ({ 
  patinhas,
  className = "",
}) => {
  if (!patinhas || patinhas.length === 0) return null;

  return (
    <div className={`patas-container patas-controlled ${className}`.trim()}>
      {patinhas.map((pata, index) => (
        <Patinha
          key={pata.id || index}
          index={pata.id || index}
          left={pata.left}
          top={pata.top}
          delay={pata.delay || 0}
          size={pata.size || "medium"}
          rotate={pata.rotate}
          opacity={pata.opacity}
          animationType={pata.animationType || "float"}
          imageSrc={pata.imageSrc || patinha}
        />
      ))}
    </div>
  );
};

PatasAleatorias.propTypes = {
  quantidade: PropTypes.number,
  minDistance: PropTypes.number,
  maxAttempts: PropTypes.number,
  bounds: PropTypes.shape({
    width: PropTypes.number,
    height: PropTypes.number,
  }),
  customImage: PropTypes.string,
  animationEnabled: PropTypes.bool,
  className: PropTypes.string,
};

PatasControladas.propTypes = {
  patinhas: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      left: PropTypes.number.isRequired,
      top: PropTypes.number.isRequired,
      delay: PropTypes.number,
      size: PropTypes.oneOf(["small", "medium", "large"]),
      rotate: PropTypes.number,
      opacity: PropTypes.number,
      animationType: PropTypes.oneOf(["float", "pulse", "spin", "none"]),
      imageSrc: PropTypes.string,
    })
  ),
  className: PropTypes.string,
};

PatasAleatorias.defaultProps = {
  quantidade: 20,
  minDistance: 15,
  maxAttempts: 100,
  bounds: { width: 100, height: 100 },
  animationEnabled: true,
  className: "",
};

PatasControladas.defaultProps = {
  className: "",
};

export default PatasAleatorias;