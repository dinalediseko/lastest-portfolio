document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('validationForm');
    const resultElement = document.getElementById('formResult');
    const captchaLabel = document.getElementById('captchaLabel');
    
    // Generate an unexpected dynamic math verification check
    let captchaSolution = 0;
    function generateCaptcha() {
        const num1 = Math.floor(Math.random() * 12) + 2; 
        const num2 = Math.floor(Math.random() * 10) + 1;
        captchaSolution = num1 + num2;
        captchaLabel.textContent = `Security Check: What is ${num1} + ${num2}?`;
    }
    generateCaptcha();

    // Mapping utility for clean execution loops
    const fields = [
        { id: 'firstName', validator: val => val !== '', errorMsg: 'First name is required.' },
        { id: 'lastName', validator: val => val !== '', errorMsg: 'Last name is required.' },
        { id: 'phoneNumber', validator: val => /^[+]?[\s./0-9-]{7,15}$/.test(val), errorMsg: 'Enter a valid phone number.' },
        { id: 'email', validator: val => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), errorMsg: 'Please enter a valid email address.' },
        { id: 'country', validator: val => val !== '', errorMsg: 'Country is required.' },
        { id: 'captcha', validator: val => parseInt(val, 10) === captchaSolution, errorMsg: 'Incorrect security answer.' }
    ];

    // Core verification engine
    function validateField(fieldConfig) {
        const element = document.getElementById(fieldConfig.id);
        const parent = element.parentElement;
        const errorSpan = document.getElementById(`${fieldConfig.id}Error`);
        const isValid = fieldConfig.validator(element.value.trim());

        if (!isValid) {
            parent.classList.add('invalid-field');
            errorSpan.textContent = fieldConfig.errorMsg;
            return false;
        } else {
            parent.classList.remove('invalid-field');
            errorSpan.textContent = '';
            return true;
        }
    }

    // Attach passive inline listeners for rapid UI updates
    fields.forEach(field => {
        const element = document.getElementById(field.id);
        element.addEventListener('input', () => validateField(field));
        element.addEventListener('blur', () => validateField(field));
    });

    // Form Interception Form Handler
    form.addEventListener('submit', (e) => {
        e.preventDefault(); // Stop raw page routing
        
        let isFormValid = true;
        fields.forEach(field => {
            const isThisFieldValid = validateField(field);
            if (!isThisFieldValid) isFormValid = false;
        });

        if (!isFormValid) {
            resultElement.textContent = 'Please fix the errors highlighted above.';
            resultElement.className = 'form-result error';
            return;
        }

        // All assertions pass safely
        resultElement.textContent = '✓ Form verified and submitted successfully!';
        resultElement.className = 'form-result success';
        
        // Reset and rotate security checks
        form.reset();
        generateCaptcha();
    });
});