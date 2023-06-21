$(document).ready(function () {
    $('.goto').click(function() {
        var target = $(this).data('target');
        $('html, body').animate({
                scrollTop: $(target).offset().top
        }, 3000)
    });
});