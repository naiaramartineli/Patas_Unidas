import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay, Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

import "./feedback.css";

// Feedback individual
const FeedbackItem = ({ texto, author, rating, date, variant = "default" }) => (
  <div className={`feedback-item feedback-item--${variant}`}>
    {rating && (
      <div className="feedback-rating">
        {"★".repeat(rating)}{"☆".repeat(5 - rating)}
      </div>
    )}
    <blockquote className="feedback-text">"{texto}"</blockquote>
    <div className="feedback-meta">
      {author && <cite className="feedback-author">— {author}</cite>}
      {date && <span className="feedback-date">{date}</span>}
    </div>
  </div>
);

FeedbackItem.propTypes = {
  texto: PropTypes.string.isRequired,
  author: PropTypes.string,
  rating: PropTypes.number,
  date: PropTypes.string,
  variant: PropTypes.oneOf(["default", "featured", "compact"]),
};

FeedbackItem.defaultProps = {
  variant: "default",
};

// Dados padrão dos feedbacks
const defaultFeedbacks = [
  {
    id: 1,
    texto: "Adotar um cachorro da UPA foi uma das melhores decisões que tomei. Além de terem me ajudado a encontrar um novo amigo, me deram todo o suporte necessário para o processo de adaptação. Hoje, meu cãozinho é parte da família!",
    author: "Ana Silva",
    rating: 5,
    date: "Janeiro 2024"
  },
  {
    id: 2,
    texto: "Saber que minha doação está ajudando animais em necessidade me dá uma sensação de propósito. É gratificante ver o impacto que todos nós podemos ter.",
    author: "Carlos Santos",
    rating: 5,
    date: "Dezembro 2023"
  },
  {
    id: 3,
    texto: "Nunca imaginei que um gesto tão simples pudesse transformar tanto minha vida. Obrigado, UPA!",
    author: "Mariana Costa",
    rating: 5,
    date: "Fevereiro 2024"
  }
];

// Componente principal FeedbacksCarousel
export default function FeedbacksCarousel({ 
  feedbacks = defaultFeedbacks,
  title = "Feedbacks!",
  showNavigation = true,
  showPagination = true,
  autoplay = true,
  slidesPerView = 1,
  loop = true,
  variant = "default",
  className = "",
}) {
  const swiperConfig = useMemo(() => ({
    slidesPerView,
    spaceBetween: 30,
    loop,
    autoplay: autoplay ? { 
      delay: 5000, 
      disableOnInteraction: false,
      pauseOnMouseEnter: true 
    } : false,
    pagination: showPagination ? { 
      clickable: true,
      dynamicBullets: true 
    } : false,
    navigation: showNavigation,
    modules: [Pagination, Autoplay, ...(showNavigation ? [Navigation] : [])],
    breakpoints: {
      640: {
        slidesPerView: Math.min(2, slidesPerView),
      },
      1024: {
        slidesPerView: Math.min(3, slidesPerView),
      },
    }
  }), [slidesPerView, loop, autoplay, showPagination, showNavigation]);

  return (
    <section className={`feedbacks-section feedbacks--${variant} ${className}`.trim()}>
      <h2 className="feedbacks-title">{title}</h2>
      
      <Swiper {...swiperConfig} className="feedbacks-swiper">
        {feedbacks.map((feedback) => (
          <SwiperSlide key={feedback.id}>
            <FeedbackItem 
              texto={feedback.texto}
              author={feedback.author}
              rating={feedback.rating}
              date={feedback.date}
              variant={variant}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}

// Feedbacks em lista (sem carousel)
export const FeedbacksList = ({ 
  feedbacks = defaultFeedbacks,
  title = "Feedbacks!",
  variant = "default",
  columns = 1,
  className = "",
}) => {
  const gridClass = `feedbacks-grid feedbacks-grid--${columns}col`;
  
  return (
    <section className={`feedbacks-section feedbacks-list feedbacks--${variant} ${className}`.trim()}>
      <h2 className="feedbacks-title">{title}</h2>
      
      <div className={gridClass}>
        {feedbacks.map((feedback) => (
          <FeedbackItem 
            key={feedback.id}
            texto={feedback.texto}
            author={feedback.author}
            rating={feedback.rating}
            date={feedback.date}
            variant={variant}
          />
        ))}
      </div>
    </section>
  );
};

FeedbacksCarousel.propTypes = {
  feedbacks: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      texto: PropTypes.string.isRequired,
      author: PropTypes.string,
      rating: PropTypes.number,
      date: PropTypes.string,
    })
  ),
  title: PropTypes.string,
  showNavigation: PropTypes.bool,
  showPagination: PropTypes.bool,
  autoplay: PropTypes.bool,
  slidesPerView: PropTypes.number,
  loop: PropTypes.bool,
  variant: PropTypes.oneOf(["default", "compact", "cards"]),
  className: PropTypes.string,
};

FeedbacksList.propTypes = {
  feedbacks: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      texto: PropTypes.string.isRequired,
      author: PropTypes.string,
      rating: PropTypes.number,
      date: PropTypes.string,
    })
  ),
  title: PropTypes.string,
  variant: PropTypes.oneOf(["default", "compact", "cards"]),
  columns: PropTypes.oneOf([1, 2, 3]),
  className: PropTypes.string,
};

FeedbacksCarousel.defaultProps = {
  showNavigation: true,
  showPagination: true,
  autoplay: true,
  slidesPerView: 1,
  loop: true,
  variant: "default",
  className: "",
};

FeedbacksList.defaultProps = {
  columns: 1,
  variant: "default",
  className: "",
};