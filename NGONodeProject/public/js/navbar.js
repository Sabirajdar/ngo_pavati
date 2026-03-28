// navbar.js
document.addEventListener('DOMContentLoaded', () => {

    /* ---------- Hamburger Menu (old one) ---------- */

    const hamburger = document.querySelector('.hamburger');
    const menu = document.querySelector('.navbarDropMenu');

    if (hamburger && menu) {
        hamburger.addEventListener('click', () => {
            menu.classList.toggle('open');
        });
    }

    /* ---------- Responsive Menu Toggle (your new one) ---------- */

    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");

    if(menuToggle && navLinks){
        menuToggle.addEventListener("click", function(){
            navLinks.classList.toggle("active");
        });
    }

});