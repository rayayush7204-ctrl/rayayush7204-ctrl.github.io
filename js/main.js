(function($) {
    $(document).ready(function() {
        // Toggle the menu on button click
        $(document).on("click", ".header-area .show-menu", function() {
            $(this).toggleClass("active");
            $(".header-area .navbar").toggleClass("active");
        });

        // Hide the menu when the page is scrolled
        $(window).on("scroll", function() {
            if ($(".header-area .navbar").hasClass("active")) {
                $(".header-area .navbar").removeClass("active");
                $(".header-area .show-menu").removeClass("active");
            }
        });

        // Initialize AOS (if you are using it for animations)
        AOS.init({
            duration: 1500,
            once: true
        });
    });
})(jQuery);

// Preloader logic
var div = document.createElement("div");
div.id = "preloader";
div.className = "preloader";
div.innerHTML = '<div class="black_wall"></div><div class="loader"></div>';
document.body.insertBefore(div, document.body.firstChild);

window.onload = function() {
    document.getElementById("preloader").classList.add("off");
};