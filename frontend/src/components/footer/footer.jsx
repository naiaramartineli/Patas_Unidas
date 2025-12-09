import React from "react";
import PropTypes from "prop-types";
import "./footer.css";
import wave from '../../assets/footer.png';
import { 
  FaInstagram, 
  FaFacebook, 
  FaWhatsapp, 
  FaTwitter,
  FaYoutube,
  FaEnvelope 
} from "react-icons/fa";

// Ícone de rede social
const SocialIcon = ({ 
  icon: Icon, 
  href, 
  label, 
  size = 28,
  variant = "default",
  className = "",
}) => (
  <a 
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className={`footer-icon footer-icon--${variant} ${className}`.trim()}
    aria-label={label}
  >
    <Icon size={size} />
  </a>
);

SocialIcon.propTypes = {
  icon: PropTypes.elementType.isRequired,
  href: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  size: PropTypes.number,
  variant: PropTypes.oneOf(["default", "circle", "square"]),
  className: PropTypes.string,
};

SocialIcon.defaultProps = {
  size: 28,
  variant: "default",
  className: "",
};

// Link do footer
const FooterLink = ({ text, href, target = "_self", rel = "" }) => (
  <a 
    href={href}
    target={target}
    rel={rel}
    className="footer-link"
  >
    {text}
  </a>
);

FooterLink.propTypes = {
  text: PropTypes.string.isRequired,
  href: PropTypes.string.isRequired,
  target: PropTypes.string,
  rel: PropTypes.string,
};

// Seção do footer
const FooterSection = ({ title, children, className = "" }) => (
  <div className={`footer-section ${className}`.trim()}>
    {title && <h3 className="footer-section-title">{title}</h3>}
    <div className="footer-section-content">
      {children}
    </div>
  </div>
);

FooterSection.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node,
  className: PropTypes.string,
};

// Dados padrão das redes sociais
const defaultSocialLinks = [
  {
    icon: FaInstagram,
    href: "https://www.instagram.com",
    label: "Instagram Patas Unidas",
    variant: "circle"
  },
  {
    icon: FaFacebook,
    href: "https://www.facebook.com",
    label: "Facebook Patas Unidas",
    variant: "circle"
  },
  {
    icon: FaWhatsapp,
    href: "https://wa.me/seunumero",
    label: "WhatsApp Patas Unidas",
    variant: "circle"
  },
  {
    icon: FaTwitter,
    href: "https://twitter.com",
    label: "Twitter Patas Unidas",
    variant: "circle"
  },
  {
    icon: FaYoutube,
    href: "https://youtube.com",
    label: "YouTube Patas Unidas",
    variant: "circle"
  },
];

// Componente principal Footer
export default function Footer({ 
  year = 2025,
  organization = "Patas Unidas",
  showWave = true,
  showCopyright = true,
  showSocial = true,
  showLinks = false,
  socialLinks = defaultSocialLinks,
  variant = "default",
  className = "",
}) {
  const currentYear = year === "current" ? new Date().getFullYear() : year;

  return (
    <footer className={`footer footer--${variant} ${className}`.trim()}>
      {showWave && (
        <img 
          src={wave} 
          alt="Onda decorativa" 
          className="footer-wave"
          loading="lazy"
        />
      )}
      
      <div className="footer-content">
        <div className="footer-main">
          {showCopyright && (
            <div className="footer-copyright">
              <h2 className="footer-title">
                {organization} © {currentYear}
              </h2>
              <p className="footer-subtitle">
                Transformando vidas, uma pata de cada vez
              </p>
            </div>
          )}
          
          {showSocial && (
            <div className="footer-social">
              <h3 className="footer-social-title">Siga-nos</h3>
              <div className="footer-icons">
                {socialLinks.map((link, index) => (
                  <SocialIcon
                    key={link.label || index}
                    icon={link.icon}
                    href={link.href}
                    label={link.label}
                    size={link.size}
                    variant={link.variant}
                  />
                ))}
              </div>
            </div>
          )}
          
          {showLinks && (
            <div className="footer-links-container">
              <FooterSection title="Links Rápidos">
                <FooterLink text="Home" href="/" />
                <FooterLink text="Adoção" href="/adocao" />
                <FooterLink text="Doações" href="/doacoes" />
                <FooterLink text="Sobre Nós" href="/sobre" />
                <FooterLink text="Contato" href="/contato" />
              </FooterSection>
              
              <FooterSection title="Contato">
                <div className="footer-contact">
                  <p><FaEnvelope /> contato@patasunidas.org</p>
                  <p><FaWhatsapp /> (12) 99999-9999</p>
                </div>
              </FooterSection>
            </div>
          )}
        </div>
        
        <div className="footer-bottom">
          <p className="footer-disclaimer">
            Projeto sem fins lucrativos • Todos os direitos reservados
          </p>
          <p className="footer-credits">
            Desenvolvido com ❤️ pela comunidade
          </p>
        </div>
      </div>
    </footer>
  );
}

// Versão simplificada do Footer
export const SimpleFooter = () => (
  <footer className="footer">
    <img src={wave} alt="Onda decorativa" className="footer-wave" />
    <div className="footer-content">
      <h2 className="footer-title">Patas Unidas © {new Date().getFullYear()}</h2>
      <div className="footer-icons">
        <a href="https://www.instagram.com" target="_blank" rel="noreferrer">
          <FaInstagram size={28} />
        </a>
        <a href="https://www.facebook.com" target="_blank" rel="noreferrer">
          <FaFacebook size={28} />
        </a>
        <a href="https://wa.me/seunumero" target="_blank" rel="noreferrer">
          <FaWhatsapp size={28} />
        </a>
      </div>
    </div>
  </footer>
);

Footer.propTypes = {
  year: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  organization: PropTypes.string,
  showWave: PropTypes.bool,
  showCopyright: PropTypes.bool,
  showSocial: PropTypes.bool,
  showLinks: PropTypes.bool,
  socialLinks: PropTypes.arrayOf(
    PropTypes.shape({
      icon: PropTypes.elementType.isRequired,
      href: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      size: PropTypes.number,
      variant: PropTypes.string,
    })
  ),
  variant: PropTypes.oneOf(["default", "minimal", "extended", "dark"]),
  className: PropTypes.string,
};

Footer.defaultProps = {
  year: "current",
  organization: "Patas Unidas",
  showWave: true,
  showCopyright: true,
  showSocial: true,
  showLinks: false,
  variant: "default",
  className: "",
};