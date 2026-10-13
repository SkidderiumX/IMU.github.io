// Mobile nav + footer year + smooth scroll
const toggle = document.querySelector('.nav-toggle');
const links = document.querySelector('.links');

if (toggle && links) {
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
}

document.getElementById('year').textContent = String(new Date().getFullYear());

document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length > 1) {
      const el = document.querySelector(id);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth' });
        links?.classList.remove('open');
      }
    }
  });
});
