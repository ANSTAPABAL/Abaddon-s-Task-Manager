import React, { useState } from 'react';
import { Sparkles, Scroll, X } from 'lucide-react';

export default function RuneOfReturnModal({ task, onConfirm, onCancel }) {
  const [whereFinished, setWhereFinished] = useState('');
  const [whyDeferred, setWhyDeferred] = useState('');
  const [whyStartedOrNot, setWhyStartedOrNot] = useState('');
  const [futureAdvice, setFutureAdvice] = useState('');

  const isMultiple = Array.isArray(task);
  const taskTitleText = isMultiple 
    ? `${task.length} активных контрактов` 
    : `«${task?.title || 'Без названия'}»`;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!whereFinished.trim() || !whyDeferred.trim() || !whyStartedOrNot.trim() || !futureAdvice.trim()) {
      alert("Заполните все руны когнитивного следа для завершения ритуала возврата!");
      return;
    }

    onConfirm({
      whereFinished: whereFinished.trim(),
      whyDeferred: whyDeferred.trim(),
      whyStartedOrNot: whyStartedOrNot.trim(),
      futureAdvice: futureAdvice.trim(),
      timestamp: new Date().toISOString()
    });
  };

  return (
    <div className="gothic-modal-overlay animate-fade-in" style={{ zIndex: 3000, background: 'rgba(5, 3, 8, 0.94)' }}>
      <div className="parchment-contract" style={{
        maxWidth: '650px',
        width: '90%',
        padding: '2rem',
        position: 'relative',
        background: 'linear-gradient(180deg, #18141d 0%, #0d0a10 100%)',
        border: '2px solid var(--color-relic-glow)',
        boxShadow: '0 0 30px rgba(255, 184, 19, 0.2), inset 0 0 15px rgba(255, 255, 255, 0.02)',
        color: 'var(--color-bone)',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-iron-light)', paddingBottom: '0.8rem', marginBottom: '1.2rem' }}>
          <h3 className="gothic-title" style={{ fontSize: '1.2rem', color: 'var(--color-relic-glow)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Scroll size={18} />
            <span>Наложение Руны Возврата</span>
          </h3>
          <button 
            className="rpg-btn" 
            style={{ padding: '2px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={onCancel}
            title="Отменить перенос"
          >
            <X size={14} />
          </button>
        </div>

        {/* Narrative Context */}
        <p style={{ fontSize: '0.88rem', color: 'var(--color-bone-dim)', lineHeight: '1.5', marginBottom: '1.5rem', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          «Ваш разум переносит контракт {taskTitleText}. Чтобы запечатать эту руну во времени, зафиксируйте свой когнитивный след для будущего себя. Это спасет вас от прокрастинации, когда вы вернетесь.»
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          
          {/* Question 1 */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-relic-glow)', marginBottom: '4px', fontFamily: 'var(--font-rpg)' }}>
              1. Где вы закончили? / Что уже сделано?
            </label>
            <textarea 
              className="rpg-input"
              style={{ width: '100%', minHeight: '60px', fontSize: '0.88rem', lineHeight: '1.4', padding: '0.5rem' }}
              placeholder="Например: Закончил набросок логики в компоненте, настроил импорты..."
              value={whereFinished}
              onChange={(e) => setWhereFinished(e.target.value)}
              required
            />
          </div>

          {/* Question 2 */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-relic-glow)', marginBottom: '4px', fontFamily: 'var(--font-rpg)' }}>
              2. Почему задача переносится? Что прервало процесс?
            </label>
            <textarea 
              className="rpg-input"
              style={{ width: '100%', minHeight: '60px', fontSize: '0.88rem', lineHeight: '1.4', padding: '0.5rem' }}
              placeholder="Например: Закончился когнитивный ресурс, отвлекли звонком, слишком нудный кусок кода..."
              value={whyDeferred}
              onChange={(e) => setWhyDeferred(e.target.value)}
              required
            />
          </div>

          {/* Question 3 */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-relic-glow)', marginBottom: '4px', fontFamily: 'var(--font-rpg)' }}>
              3. Почему начали или не начали делать её в период дедлайна?
            </label>
            <textarea 
              className="rpg-input"
              style={{ width: '100%', minHeight: '60px', fontSize: '0.88rem', lineHeight: '1.4', padding: '0.5rem' }}
              placeholder="Например: Не начал, так как испугался объема и не знал с чего зайти; начал, но быстро отвлекся..."
              value={whyStartedOrNot}
              onChange={(e) => setWhyStartedOrNot(e.target.value)}
              required
            />
          </div>

          {/* Question 4 */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-relic-glow)', marginBottom: '4px', fontFamily: 'var(--font-rpg)' }}>
              4. Напутствие, совет или призыв для будущего себя (вклад в будущее):
            </label>
            <textarea 
              className="rpg-input"
              style={{ width: '100%', minHeight: '60px', fontSize: '0.88rem', lineHeight: '1.4', padding: '0.5rem' }}
              placeholder="Например: Не пиши всё сразу. Сначала проверь console.log для входных параметров. Включи музыку и поставь таймер на 5 минут!"
              value={futureAdvice}
              onChange={(e) => setFutureAdvice(e.target.value)}
              required
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', borderTop: '1px solid var(--color-iron-light)', paddingTop: '1rem', marginTop: '0.5rem' }}>
            <button 
              type="button" 
              className="rpg-btn"
              onClick={onCancel}
              style={{ padding: '8px 20px', fontSize: '0.9rem' }}
            >
              Отменить перенос
            </button>
            <button 
              type="submit" 
              className="rpg-btn rpg-btn-mana"
              style={{ padding: '8px 25px', fontSize: '0.9rem', borderColor: 'var(--color-relic-glow)' }}
            >
              ✨ Наложить Руну и перенести
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
