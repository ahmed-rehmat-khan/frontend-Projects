document.addEventListener('DOMContentLoaded', () => {
  const footer = document.querySelector('.footer p');
  if (footer) {
    const year = new Date().getFullYear();
    footer.textContent = `© ${year} Velvet Spoon. Crafted with love.`;
  }
});
