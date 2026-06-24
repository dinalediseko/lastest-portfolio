$(document).ready(function () {
    // Sticky navbar
    $(window).scroll(function () {
        if (this.scrollY > 20) {
            $('.navbar').addClass("sticky");
        } else {
            $('.navbar').removeClass("sticky");
        }
        // Scroll-up button
        if (this.scrollY > 500) {
            $('.scroll-up-btn').addClass("show");
        } else {
            $('.scroll-up-btn').removeClass("show");
        }
    });

    // Scroll to top
    $('.scroll-up-btn').click(function () {
        $('html').animate({ scrollTop: 0 });
        $('html').css("scrollBehavior", "auto");
    });

    // Smooth scroll on menu click
    $('.navbar .menu li a').click(function () {
        $('html').css("scrollBehavior", "smooth");
    });

    // Mobile menu toggle
    $('.menu-btn').click(function () {
        $('.navbar .menu').toggleClass("active");
        $('.menu-btn i').toggleClass("active");
    });

    // Typing animation
    var typed = new Typed(".typing", {
        strings: ["Creative Director", "Photographer", "Videographer", "Designer", "Freelancer"],
        typeSpeed: 100,
        backSpeed: 60,
        loop: true
    });

    var typed2 = new Typed(".typing-2", {
        strings: ["Creative Director", "Photographer", "Videographer", "Designer", "Freelancer"],
        typeSpeed: 100,
        backSpeed: 60,
        loop: true
    });

    // Owl Carousel
    $('.carousel').owlCarousel({
        margin: 20,
        loop: true,
        autoplay: true,
        autoplayTimeout: 2000,
        autoplayHoverPause: true,
        responsive: {
            0: { items: 1, nav: false },
            600: { items: 2, nav: false },
            1000: { items: 3, nav: false }
        }
    });

    // Download Portfolio button behaviour
    $('#download-btn').on('click', function () {
        const email = $('#portfolio-email').val().trim();
        if (!email || !email.includes('@')) {
            alert('Please enter a valid email address.');
            return;
        }
        // Simulate a PDF download – replace 'your-pdf-file.pdf' with your actual file
        const link = document.createElement('a');
        link.href = 'your-pdf-file.pdf'; // <-- update with your portfolio PDF path
        link.download = 'DSeikou_Portfolio.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // Optional: you could also send the email to a service for tracking
    });

    // Dynamic year in footer
    document.getElementById('year').textContent = new Date().getFullYear();
});