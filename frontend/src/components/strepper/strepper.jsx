import React, { memo } from "react";
import PropTypes from "prop-types";
import "./stepper.css";

// Círculo de cada passo
const StepCircle = ({ 
  number, 
  isActive, 
  isLast, 
  isCompleted,
  showCheckmark = true 
}) => {
  const content = isLast && isCompleted && showCheckmark ? (
    <span className="checkmark" aria-label="Concluído">✓</span>
  ) : (
    number
  );

  return (
    <div 
      className={`circle ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}
      aria-current={isActive ? "step" : undefined}
    >
      {content}
    </div>
  );
};

StepCircle.propTypes = {
  number: PropTypes.number.isRequired,
  isActive: PropTypes.bool.isRequired,
  isLast: PropTypes.bool.isRequired,
  isCompleted: PropTypes.bool.isRequired,
  showCheckmark: PropTypes.bool,
};

StepCircle.defaultProps = {
  showCheckmark: true,
};

// Linha entre os passos
const StepLine = ({ isActive, orientation = "horizontal" }) => (
  <div 
    className={`line ${isActive ? "active" : ""} line--${orientation}`}
    aria-hidden="true"
  />
);

StepLine.propTypes = {
  isActive: PropTypes.bool.isRequired,
  orientation: PropTypes.oneOf(["horizontal", "vertical"]),
};

StepLine.defaultProps = {
  orientation: "horizontal",
};

// Rótulo do passo
const StepLabel = ({ label, isActive, description }) => (
  <div className="step-label-container">
    <span className={`step-label ${isActive ? "active" : ""}`}>
      {label}
    </span>
    {description && (
      <span className="step-description">{description}</span>
    )}
  </div>
);

StepLabel.propTypes = {
  label: PropTypes.string.isRequired,
  isActive: PropTypes.bool.isRequired,
  description: PropTypes.string,
};

// Componente individual do passo
const Step = ({ 
  index,
  label,
  description,
  isActive,
  isCompleted,
  isLast,
  onStepClick,
  orientation = "horizontal",
  showLabel = true,
  showDescription = false,
}) => {
  const canClick = isActive || isCompleted;
  
  const handleClick = () => {
    if (canClick && onStepClick) {
      onStepClick(index);
    }
  };

  return (
    <div 
      className={`step step--${orientation}`}
      onClick={handleClick}
      role={canClick ? "button" : "presentation"}
      tabIndex={canClick ? 0 : -1}
      onKeyDown={(e) => canClick && e.key === 'Enter' && handleClick()}
      style={{ cursor: canClick ? "pointer" : "default" }}
      aria-label={label}
      aria-disabled={!canClick}
    >
      <StepCircle 
        number={index + 1}
        isActive={isActive}
        isLast={isLast}
        isCompleted={isCompleted}
      />
      
      {showLabel && (
        <StepLabel 
          label={label}
          description={showDescription ? description : undefined}
          isActive={isActive}
        />
      )}
      
      {!isLast && (
        <StepLine 
          isActive={isCompleted}
          orientation={orientation}
        />
      )}
    </div>
  );
};

Step.propTypes = {
  index: PropTypes.number.isRequired,
  label: PropTypes.string.isRequired,
  description: PropTypes.string,
  isActive: PropTypes.bool.isRequired,
  isCompleted: PropTypes.bool.isRequired,
  isLast: PropTypes.bool.isRequired,
  onStepClick: PropTypes.func,
  orientation: PropTypes.oneOf(["horizontal", "vertical"]),
  showLabel: PropTypes.bool,
  showDescription: PropTypes.bool,
};

Step.defaultProps = {
  orientation: "horizontal",
  showLabel: true,
  showDescription: false,
};

// Componente principal Stepper
const Stepper = ({ 
  steps = [], 
  currentStep = 0, 
  onStepClick,
  orientation = "horizontal",
  showLabels = true,
  showDescriptions = false,
  className = "",
}) => {
  return (
    <div 
      className={`stepper stepper--${orientation} ${className}`.trim()}
      role="navigation"
      aria-label="Progresso"
    >
      {steps.map((step, index) => {
        const isActive = index <= currentStep;
        const isCompleted = index < currentStep;
        const isLast = index === steps.length - 1;
        
        return (
          <Step
            key={step.id || index}
            index={index}
            label={step.label}
            description={step.description}
            isActive={isActive}
            isCompleted={isCompleted}
            isLast={isLast}
            onStepClick={onStepClick}
            orientation={orientation}
            showLabel={showLabels}
            showDescription={showDescriptions}
          />
        );
      })}
    </div>
  );
};

Stepper.propTypes = {
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.string.isRequired,
      description: PropTypes.string,
    })
  ).isRequired,
  currentStep: PropTypes.number,
  onStepClick: PropTypes.func,
  orientation: PropTypes.oneOf(["horizontal", "vertical"]),
  showLabels: PropTypes.bool,
  showDescriptions: PropTypes.bool,
  className: PropTypes.string,
};

Stepper.defaultProps = {
  currentStep: 0,
  orientation: "horizontal",
  showLabels: true,
  showDescriptions: false,
  className: "",
};

// Versão simplificada do Stepper
export const SimpleStepper = memo(({ steps = [], currentStep = 0 }) => {
  return (
    <div className="stepper">
      {steps.map((_, index) => {
        const active = index <= currentStep;
        const last = index === steps.length - 1;

        return (
          <div
            key={index}
            className="step"
            role="presentation"
          >
            <div className={`circle ${active ? "active" : ""}`}>
              {last && active ? (
                <span className="checkmark">✔</span>
              ) : (
                index + 1
              )}
            </div>

            {!last && (
              <div className={`line ${index < currentStep ? "active" : ""}`} />
            )}
          </div>
        );
      })}
    </div>
  );
});

SimpleStepper.displayName = 'SimpleStepper';

export default memo(Stepper);