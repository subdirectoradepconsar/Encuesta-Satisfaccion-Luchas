/**
 * CONSAR - Encuesta de Satisfacción (JavaScript)
 * Lógica interactiva, cálculo de progreso, accesibilidad y validación.
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('surveyForm');
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

    progressBarFill.style.width = `${percentage}%`;
    progressText.textContent = `${percentage}% completado`;
    progressBarContainer.setAttribute('aria-valuenow', percentage);
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
      charCount.textContent = `${length} / 500 caracteres`;

      // Limpiar error al escribir
      const card = q6Textarea.closest('.question-card');
      if (card && q6Textarea.value.trim().length > 0) {
        card.classList.remove('error-state');
      }

      updateProgress();
    });
  }

  /**
   * Validación completa al enviar el formulario
   */
  form.addEventListener('submit', (e) => {
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
    if (!q6Textarea.value.trim()) {
      isValid = false;
      if (cardQ6) {
        cardQ6.classList.add('error-state');
        if (!firstErrorCard) firstErrorCard = cardQ6;
      }
    } else {
      if (cardQ6) cardQ6.classList.remove('error-state');
    }

    // Si hay algún error, desplazar la pantalla a la primera pregunta sin responder
    if (!isValid) {
      if (firstErrorCard) {
        firstErrorCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Si todo está correcto, mostrar el modal de éxito
    successModal.classList.add('active');
    successModal.setAttribute('aria-hidden', 'false');
  });

  /**
   * Reinicio del formulario desde el modal
   */
  closeModalBtn.addEventListener('click', () => {
    successModal.classList.remove('active');
    successModal.setAttribute('aria-hidden', 'true');

    // Limpiar formulario y estados
    form.reset();
    likertOptions.forEach(option => {
      option.classList.remove('selected');
      option.removeAttribute('data-value');
    });

    // Limpiar errores
    document.querySelectorAll('.question-card').forEach(card => {
      card.classList.remove('error-state');
    });

    if (charCount) {
      charCount.textContent = '0 / 500 caracteres';
    }

    updateProgress();

    // Scroll suave al inicio de la página
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Inicializar estado de la barra de progreso
  updateProgress();
});
