import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../../components/Header/Header";
import Footer from "../../components/footer/footer";
import PatasAleatorias from "../../components/patas/PatasAleatorias";
import Card from "../../components/Card/card"; 
import { adocaoService } from "../../services/adocaoService";
import "./adocao.css";

export default function Adocao() {
  const location = useLocation();
  const navigate = useNavigate();
  const cachorro = location.state?.cachorro;
  const formularioURL = "https://docs.google.com/forms/d/e/...."; // coloque o link da ONG

  const [enviando, setEnviando] = useState(false);
  const [confirmado, setConfirmado] = useState(false);

  const registrarTentativaAdocao = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        alert("É preciso estar logado!");
        navigate('/login');
        return;
      }

      setEnviando(true);

      // Usando o serviço de adoção
      await adocaoService.solicitarAdocao(cachorro.id_cao, "Solicitação via formulário externo");
      setConfirmado(true);
    } catch (e) {
      console.error("Erro ao solicitar adoção:", e);
      alert(e.response?.data?.message || "Erro ao registrar a tentativa de adoção!");
    } finally {
      setEnviando(false);
    }
  };

  const abrirFormulario = () => {
    registrarTentativaAdocao();
    window.open(formularioURL, "_blank");
  };

  if (!cachorro) {
    return (
      <div className="adocao-wrapper">
        <Header />
        <p style={{ padding: 40 }}>Nenhum cachorro selecionado.</p>
        <Footer />
      </div>
    );
  }

  return (
    <div className="adocao-wrapper">
      <Header />

      <div className="adocao-patinhas-background">
        <PatasAleatorias quantidade={20} />
      </div>

      <main className="adocao-container">
        <h1 className="adocao-titulo">🐶 Obrigado por querer transformar uma vida!</h1>

        <p className="adocao-texto">
          A adoção é um gesto de amor gigantesco — e estamos muito felizes por você ter dado o primeiro passo.
          Agora é só preencher o formulário e nossa equipe entrará em contato 💜
        </p>

        <div className="adocao-card-wrapper">
          <Card
            titulo={cachorro.nome}
            descricao={cachorro.descricao || "Um pet cheio de amor esperando por você!"}
            img={cachorro.foto_url}
            textoBotao={enviando ? "Aguarde..." : "Preencher formulário de adoção"}
            onClick={abrirFormulario}
            disabled={enviando}
          />
        </div>

        {confirmado && (
          <div className="adocao-confirmacao">
            ✔ Formulário aberto!  
            <br />
            Nossa equipe também recebeu sua tentativa de adoção — vamos conferir tudo direitinho 💜🐾
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}