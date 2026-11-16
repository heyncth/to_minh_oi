"use client";

export function AdminSteps({
  step,
  onBack,
}: {
  step: 1 | 2;
  onBack?: () => void;
}) {
  return (
    <div className="admin-step" aria-label="Tiến trình đăng tin">
      {step === 1 ? (
        <span className="admin-step__item admin-step__item--on" aria-current="step">
          <span className="admin-step__num">1</span> Nội dung
        </span>
      ) : (
        <button type="button" className="admin-step__item admin-step__link" onClick={onBack}>
          <span className="admin-step__num">1</span> Nội dung
        </button>
      )}
      <span className={`admin-step__item${step === 2 ? " admin-step__item--on" : ""}`} aria-current={step === 2 ? "step" : undefined}>
        <span className="admin-step__num">2</span> Kiểm tra &amp; đăng
      </span>
    </div>
  );
}
