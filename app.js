/**
 * CONSAR - Encuesta de Satisfacción (JavaScript)
 * Lógica interactiva, cálculo de progreso, validación y conexión en tiempo real con Google Sheets vía Google Apps Script.
 */

document.addEventListener('DOMContentLoaded', () => {
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyT7DiS_Im1hu-2AJqwFhbMfN2QMCGgrX3Tb3Z40eGxsPViNtxobD7Qh5-ivhtJ_F3u/exec';

  const LIKERT_MAP = {
    '1': '1 - Muy Insatisfecho',
    '2': '2 - Insatisfecho',
    '3': '3 - Regular',
    '4': '4 - Satisfecho',
    '5': '5 - Muy Satisfecho'
  };

  const form = document.getElementById('surveyForm');
  const submitBtn = document.getElementById('submitBtn');
  const progressBarFill = document.getElementById('progressBarFill');
  const progressText = document.getElementById('progressText');
  const progressBarContainer = document.getElementById('progressBarContainer');
  const q6Textarea = document.getElementById('q6');
  const charCount = document.getElementById('charCount');
  const successModal = document.getElementById('successModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const likertOptions = document.querySelectorAll('.likert-option');

  const questionNames = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'];
  const totalQuestions = questionNames.length;

  /**
   * Actualiza el progreso de llenado en la barra superior
   */
  function updateProgress() {
    let answeredCount = 0;

    // Preguntas 1 a 5 (Radios)
    for (let i = 1; i <= 5; i++) {
      const selected = form.querySelector(`input[name="q${i}"]:checked`);
      if (selected) {
        answeredCount++;
      }
    }

    // Pregunta 6 (Textarea)
    if (q6Textarea && q6Textarea.value.trim().length > 0) {
      answeredCount++;
    }

    const percentage = Math.round((answeredCount / totalQuestions) * 100);

    if (progressBarFill) progressBarFill.style.width = `${percentage}%`;
    if (progressText) progressText.textContent = `${percentage}% completado`;
    if (progressBarContainer) progressBarContainer.setAttribute('aria-valuenow', percentage);
  }

  /**
   * Sincronización visual de estado para radios Likert
   */
  likertOptions.forEach(option => {
    const radio = option.querySelector('input[type="radio"]');

    // Selección al dar clic
    option.addEventListener('click', () => {
      if (radio) {
        radio.checked = true;
        const groupName = radio.name;
        // Quitar clase error del card padre
        const card = option.closest('.question-card');
        if (card) card.classList.remove('error-state');

        // Quitar selección previa en el mismo grupo
        document.querySelectorAll(`input[name="${groupName}"]`).forEach(r => {
          const parent = r.closest('.likert-option');
          if (parent) {
            parent.classList.remove('selected');
            parent.removeAttribute('data-value');
          }
        });

        // Marcar la opción seleccionada
        option.classList.add('selected');
        option.setAttribute('data-value', radio.value);

        updateProgress();
      }
    });

    // Accesibilidad por teclado (Teclas Enter o Espacio)
    option.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        option.click();
      }
    });
  });

  /**
   * Contador de caracteres para la pregunta 6
   */
  if (q6Textarea) {
    q6Textarea.addEventListener('input', () => {
      const length = q6Textarea.value.length;
      if (charCount) charCount.textContent = `${length} / 500 caracteres`;

      // Limpiar error al escribir
      const card = q6Textarea.closest('.question-card');
      if (card && q6Textarea.value.trim().length > 0) {
        card.classList.remove('error-state');
      }

      updateProgress();
    });
  }

  /**
   * Envío del formulario y guardado en Google Sheets
   */
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      let isValid = true;
      let firstErrorCard = null;

      // Validar preguntas 1 a 5
      for (let i = 1; i <= 5; i++) {
        const card = document.getElementById(`card-q${i}`);
        const selectedRadio = form.querySelector(`input[name="q${i}"]:checked`);

        if (!selectedRadio) {
          isValid = false;
          if (card) {
            card.classList.add('error-state');
            if (!firstErrorCard) firstErrorCard = card;
          }
        } else {
          if (card) card.classList.remove('error-state');
        }
      }

      // Validar pregunta 6
      const cardQ6 = document.getElementById('card-q6');
      if (q6Textarea && !q6Textarea.value.trim()) {
        isValid = false;
        if (cardQ6) {
          cardQ6.classList.add('error-state');
          if (!firstErrorCard) firstErrorCard = cardQ6;
        }
      } else if (cardQ6) {
        cardQ6.classList.remove('error-state');
      }

      // Si hay algún error, desplazar la pantalla a la primera pregunta sin responder
      if (!isValid) {
        if (firstErrorCard) {
          firstErrorCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      // Preparar el payload con el formato exacto requerido
      const q1Selected = form.querySelector('input[name="q1"]:checked');
      const q2Selected = form.querySelector('input[name="q2"]:checked');
      const q3Selected = form.querySelector('input[name="q3"]:checked');
      const q4Selected = form.querySelector('input[name="q4"]:checked');
      const q5Selected = form.querySelector('input[name="q5"]:checked');

      const payload = {
        q1: LIKERT_MAP[q1Selected.value] || q1Selected.value,
        q2: LIKERT_MAP[q2Selected.value] || q2Selected.value,
        q3: LIKERT_MAP[q3Selected.value] || q3Selected.value,
        q4: LIKERT_MAP[q4Selected.value] || q4Selected.value,
        q5: LIKERT_MAP[q5Selected.value] || q5Selected.value,
        q6: q6Textarea ? q6Textarea.value.trim() : ''
      };

      // Estado de UI de envío
      const originalBtnHTML = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Guardando...';
      }

      try {
        await fetch(SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify(payload)
        });

        // Mostrar modal de confirmación
        if (successModal) {
          successModal.classList.add('active');
          successModal.setAttribute('aria-hidden', 'false');
        }

        // Restablecer formulario y estados visuales
        form.reset();
        likertOptions.forEach(option => {
          option.classList.remove('selected');
          option.removeAttribute('data-value');
        });

        document.querySelectorAll('.question-card').forEach(card => {
          card.classList.remove('error-state');
        });

        if (charCount) {
          charCount.textContent = '0 / 500 caracteres';
        }

        updateProgress();
      } catch (error) {
        console.error('Error al enviar la encuesta:', error);
        alert('Ocurrió un error de conexión al enviar tus respuestas. Por favor, verifica tu conexión e inténtalo de nuevo.');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnHTML;
        }
      }
    });
  }

  /**
   * Cierre del modal y preparación para responder otra encuesta
   */
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      if (successModal) {
        successModal.classList.remove('active');
        successModal.setAttribute('aria-hidden', 'true');
      }

      // Scroll suave al inicio de la página
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Inicializar estado de la barra de progreso
  updateProgress();
});
