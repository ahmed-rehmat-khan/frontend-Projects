const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
const favoriteButtons = document.querySelectorAll('.favorite-button');
const mortgageForm = document.querySelector('#mortgage-form');
const mortgageResult = document.querySelector('#mortgage-result');

if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('nav-open');
    menuToggle.classList.toggle('open');
  });
}

favoriteButtons.forEach(button => {
  button.addEventListener('click', e => {
    e.preventDefault();
    button.classList.toggle('active');
    const label = button.querySelector('span');
    if (button.classList.contains('active')) {
      label.textContent = 'Saved';
    } else {
      label.textContent = 'Save';
    }
  });
});

if (mortgageForm && mortgageResult) {
  mortgageForm.addEventListener('submit', event => {
    event.preventDefault();
    const price = Number(document.querySelector('#price')?.value || 0);
    const downPayment = Number(document.querySelector('#down-payment')?.value || 0);
    const rate = Number(document.querySelector('#interest-rate')?.value || 0) / 100;
    const termYears = Number(document.querySelector('#term-years')?.value || 0);

    const principal = price - downPayment;
    const monthlyRate = rate / 12;
    const payments = termYears * 12;
    const monthly = principal * (monthlyRate * Math.pow(1 + monthlyRate, payments)) / (Math.pow(1 + monthlyRate, payments) - 1);

    if (!isFinite(monthly)) {
      mortgageResult.textContent = 'Please enter valid mortgage values.';
      return;
    }

    mortgageResult.textContent = `Estimated monthly payment: $${monthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  });
}

const filters = document.querySelectorAll('.filter-select');
filters.forEach(select => {
  select.addEventListener('change', () => {
    select.parentElement?.classList.add('filter-set');
  });
});

window.addEventListener('load', () => {
  const animations = document.querySelectorAll('.fade-up');
  animations.forEach((item, index) => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(24px)';
    setTimeout(() => {
      item.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
      item.style.opacity = '1';
      item.style.transform = 'translateY(0)';
    }, 180 * index);
  });
});
