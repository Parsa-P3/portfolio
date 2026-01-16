document.addEventListener('DOMContentLoaded', () => {
    const observerOptions = {
        threshold: 0.15,
        rootMargin: "0px"
    };

    const revealOnScroll = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            } else {
                entry.target.classList.remove('visible');
            }
        });
    }, observerOptions);

    const elements = document.querySelectorAll('.animate-fade-up, .animate-left, .animate-right');
    elements.forEach(el => revealOnScroll.observe(el));

    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.padding = "15px 0";
            navbar.style.background = "rgba(5,5,5,0.95)";
            navbar.style.borderBottom = "1px solid #1a1a1a";
        } else {
            navbar.style.padding = "25px 0";
            navbar.style.background = "rgba(5,5,5,0.8)";
            navbar.style.borderBottom = "none";
        }
    });
});