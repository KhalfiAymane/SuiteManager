class ModalService {
  constructor() {
    this.currentModal = null;
  }

  show(title, content, buttons = []) {
    this.close();

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close" id="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          ${content}
        </div>
        <div class="modal-footer">
          ${buttons.map((btn, index) => `
            <button class="btn ${btn.class || 'btn-primary'}" data-action="${index}">
              ${btn.text}
            </button>
          `).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.currentModal = modal;

    // Close button
    modal.querySelector('#modal-close').addEventListener('click', () => this.close());

    // Button actions
    buttons.forEach((btn, index) => {
      const btnElement = modal.querySelector(`[data-action="${index}"]`);
      btnElement.addEventListener('click', () => {
        if (btn.handler) {
          btn.handler();
        }
        if (btn.action === 'close' || !btn.action) {
          this.close();
        }
      });
    });

    // Close on overlay click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.close();
      }
    });

    // Close on ESC key
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        this.close();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  showForm(title, fields, onSubmit) {
    const formContent = `
      <form id="modal-form">
        ${fields.map((field, index) => {
          if (field.type === 'select') {
            return `
              <div class="form-group" data-field="${field.name}">
                <label for="field-${index}">${field.label}${field.required ? ' *' : ''}</label>
                <select id="field-${index}" name="${field.name}" ${field.required ? 'required' : ''}>
                  ${field.options.map(opt => `
                    <option value="${opt.value}" ${field.value === opt.value ? 'selected' : ''}>
                      ${opt.label}
                    </option>
                  `).join('')}
                </select>
                <span class="error-message" id="error-${field.name}"></span>
              </div>
            `;
          } else if (field.type === 'textarea') {
            return `
              <div class="form-group" data-field="${field.name}">
                <label for="field-${index}">${field.label}${field.required ? ' *' : ''}</label>
                <textarea 
                  id="field-${index}" 
                  name="${field.name}" 
                  ${field.required ? 'required' : ''}
                  rows="4"
                >${field.value || ''}</textarea>
                <span class="error-message" id="error-${field.name}"></span>
              </div>
            `;
          } else {
            return `
              <div class="form-group" data-field="${field.name}">
                <label for="field-${index}">${field.label}${field.required ? ' *' : ''}</label>
                <input 
                  type="${field.type || 'text'}" 
                  id="field-${index}" 
                  name="${field.name}" 
                  value="${field.value || ''}"
                  ${field.required ? 'required' : ''}
                  ${field.min !== undefined ? `min="${field.min}"` : ''}
                  ${field.max !== undefined ? `max="${field.max}"` : ''}
                  ${field.step !== undefined ? `step="${field.step}"` : ''}
                />
                <span class="error-message" id="error-${field.name}"></span>
              </div>
            `;
          }
        }).join('')}
      </form>
    `;

    this.show(title, formContent, [
      { 
        text: 'Cancel', 
        class: 'btn-outline', 
        action: 'close' 
      },
      { 
        text: 'Save', 
        class: 'btn-primary', 
        handler: () => {
          const form = document.getElementById('modal-form');
          if (form.checkValidity()) {
            const formData = new FormData(form);
            const data = {};
            formData.forEach((value, key) => {
              data[key] = value;
            });
            
            // Clear previous errors
            document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
            document.querySelectorAll('.form-group').forEach(el => el.classList.remove('has-error'));
            
            if (onSubmit(data)) {
              this.close();
            }
          } else {
            form.reportValidity();
          }
        }
      }
    ]);
  }

  showError(fieldName, message) {
    const errorElement = document.getElementById(`error-${fieldName}`);
    if (errorElement) {
      errorElement.textContent = message;
      const formGroup = errorElement.closest('.form-group');
      if (formGroup) {
        formGroup.classList.add('has-error');
      }
    }
  }

  confirm(title, message, onConfirm) {
    this.show(title, `<p>${message}</p>`, [
      { 
        text: 'Cancel', 
        class: 'btn-outline', 
        action: 'close' 
      },
      { 
        text: 'Confirm', 
        class: 'btn-danger', 
        handler: () => {
          onConfirm();
          this.close();
        }
      }
    ]);
  }

  alert(title, message) {
    this.show(title, `<p>${message}</p>`, [
      { 
        text: 'OK', 
        class: 'btn-primary', 
        action: 'close' 
      }
    ]);
  }

  close() {
    if (this.currentModal) {
      this.currentModal.remove();
      this.currentModal = null;
    }
  }
}

export const modal = new ModalService();