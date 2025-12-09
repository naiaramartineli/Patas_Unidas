import React from "react";
import { useAuth } from "../../../hooks/useAuth";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import "./sobreNos.css";

export default function SobreNos() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="sobre-nos-container">
      {/* Header com navegação */}
      <Header />

      {/* Hero Section */}
      <section className="sobre-hero">
        <div className="sobre-hero-content">
          <h1>PATAS UNIDAS</h1>
          <p>
            Somos uma plataforma dedicada a conectar cães que precisam de um lar com pessoas<br/>
            dispostas a oferecer amor e cuidado. Transformamos vidas, uma pata de cada vez.
          </p>
          {!isAuthenticated && (
            <button 
              className="btn-hero"
              onClick={() => window.location.href = '/registro'}
            >
              Quero fazer parte
            </button>
          )}
        </div>
      </section>

      {/* Nossa Missão */}
      <section className="section-title">
        <h2>O que nos move?</h2>
        <p>Nossos princípios fundamentais guiam nosso trabalho e definem nosso compromisso com os animais.</p>

        <div className="cards-row">
          <div className="info-card">
            <div className="card-icon">🐾</div>
            <h3>Missão</h3>
            <p>
              Conectar cães abandonados a lares amorosos, promovendo a adoção responsável
              e conscientização sobre posse responsável de animais.
            </p>
          </div>

          <div className="info-card">
            <div className="card-icon">👁️</div>
            <h3>Visão</h3>
            <p>
              Ser a principal plataforma de adoção do país, reduzindo significativamente
              o número de animais abandonados através da educação e tecnologia.
            </p>
          </div>

          <div className="info-card">
            <div className="card-icon">❤️</div>
            <h3>Valores</h3>
            <p>
              Compaixão, responsabilidade,<br/>
              transparência, empatia e<br/>
              compromisso com o bem-estar animal.
            </p>
          </div>
        </div>
      </section>

      {/* Sobre Nós Detalhado */}
      <section className="sobre-detalhado">
        <div className="sobre-texto">
          <h2>Sobre nós</h2>
          <p>
            A Patas Unidas nasceu da necessidade de criar uma ponte entre cães que precisam de um lar
            e pessoas dispostas a oferecer amor e cuidado. Acreditamos que todo animal merece uma
            segunda chance e um lar onde seja amado e respeitado.
          </p>
          <p>
            Nossa plataforma utiliza tecnologia para facilitar o processo de adoção, garantindo
            segurança tanto para os adotantes quanto para os animais. Trabalhamos em parceria com
            protetores independentes e ONGs para ampliar nosso alcance e impacto.
          </p>
          <div className="estatisticas">
            <div className="estatistica">
              <h4>+500</h4>
              <p>Cães adotados</p>
            </div>
            <div className="estatistica">
              <h4>+50</h4>
              <p>Parceiros</p>
            </div>
            <div className="estatistica">
              <h4>+1000</h4>
              <p>Voluntários</p>
            </div>
          </div>
        </div>

        <div className="sobre-imagem">
          <img src="/images/caes-adocao.jpg" alt="Cães adotados felizes" />
        </div>
      </section>

      {/* Como Funciona */}
      <section className="como-funciona">
        <h2>Como funciona a adoção?</h2>
        <div className="passos">
          <div className="passo">
            <div className="passo-numero">1</div>
            <h4>Encontre seu amigo</h4>
            <p>Navegue pelos cães disponíveis e encontre aquele que tem tudo a ver com você.</p>
          </div>
          <div className="passo">
            <div className="passo-numero">2</div>
            <h4>Solicite a adoção</h4>
            <p>Preencha o formulário de interesse e aguarde o contato da nossa equipe.</p>
          </div>
          <div className="passo">
            <div className="passo-numero">3</div>
            <h4>Conheça pessoalmente</h4>
            <p>Agende uma visita para conhecer o cão e ver se há compatibilidade.</p>
          </div>
          <div className="passo">
            <div className="passo-numero">4</div>
            <h4>Leve para casa</h4>
            <p>Após aprovação, assine o termo de responsabilidade e leve seu novo amigo!</p>
          </div>
        </div>
      </section>

      {/* Time */}
      <section className="time">
        <h2>Conheça nossa equipe</h2>
        <p className="time-descricao">
          Somos uma equipe apaixonada por animais e comprometida com a causa animal.
        </p>

        <div className="time-row">
          <div className="time-card">
            <div className="time-photo">
              <img src="/images/equipe1.jpg" alt="Membro da equipe" />
            </div>
            <h4>Mariana Silva</h4>
            <p>Coordenadora de Adoções</p>
            <p className="time-bio">Veterinária com 10 anos de experiência em resgate animal.</p>
          </div>

          <div className="time-card">
            <div className="time-photo">
              <img src="/images/equipe2.jpg" alt="Membro da equipe" />
            </div>
            <h4>Carlos Mendes</h4>
            <p>Desenvolvedor FullStack</p>
            <p className="time-bio">Responsável pela plataforma e experiência do usuário.</p>
          </div>

          <div className="time-card">
            <div className="time-photo">
              <img src="/images/equipe3.jpg" alt="Membro da equipe" />
            </div>
            <h4>Ana Costa</h4>
            <p>Assistente Social</p>
            <p className="time-bio">Avalia famílias e promove educação sobre posse responsável.</p>
          </div>

          <div className="time-card">
            <div className="time-photo">
              <img src="/images/equipe4.jpg" alt="Membro da equipe" />
            </div>
            <h4>Roberto Alves</h4>
            <p>Coordenador de Parcerias</p>
            <p className="time-bio">Estabelece parcerias com clínicas e pet shops.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-content">
          <h3>Pronto para mudar uma vida?</h3>
          <p>Adote um cão e ganhe um amigo para toda a vida.</p>
          <div className="cta-buttons">
            <button 
              className="btn-cta-primary"
              onClick={() => window.location.href = '/caes'}
            >
              Ver cães disponíveis
            </button>
            {!isAuthenticated && (
              <button 
                className="btn-cta-secondary"
                onClick={() => window.location.href = '/registro'}
              >
                Cadastre-se
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}