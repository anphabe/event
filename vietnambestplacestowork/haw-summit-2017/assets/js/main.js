"use strict";
jQuery(document).ready(function ($) {

//for Preloader

    $(window).load(function () {
        $("#loading").fadeOut(500);
    });


    /*---------------------------------------------*
     * Mobile menu
     ---------------------------------------------*/
    $('#navbar-menu').find('a[href*=#]:not([href=#])').click(function () {
        if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
            var target = $(this.hash);
            target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
            if (target.length) {
                $('html,body').animate({
                    scrollTop: (target.offset().top - 180)
                }, 1000);
                if ($('.navbar-toggle').css('display') != 'none') {
                    $(this).parents('.container').find(".navbar-toggle").trigger("click");
                }
                return false;
            }
        }
    });


    /*---------------------------------------------*
     * WOW
     ---------------------------------------------*/

    var wow = new WOW({
        mobile: false // trigger animations on mobile devices (default is true)
    });
    //  wow.init();

// magnificPopup

    $('.popup-img').magnificPopup({
        type: 'image',
        gallery: {
            enabled: true
        }
    });

    $('.video-link').magnificPopup({
        type: 'iframe'
    });


// slick slider active Home Page Tow
    $(".hello_slid").slick({
        dots: true,
        infinite: false,
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: true,
        prevArrow: "<i class='icon icon-chevron-left nextprevleft'></i>",
        nextArrow: "<i class='icon icon-chevron-right nextprevright'></i>",
        autoplay: true,
        autoplaySpeed: 2000
    });


//---------------------------------------------
// Scroll Up 
//---------------------------------------------

    $('.scrollup').click(function () {
        $("html, body").animate({scrollTop: 0}, 1000);
        return false;
    });


//---------------------------------------------
// Modal
//---------------------------------------------

    $('#myModal').on('shown.bs.modal', function () {
        $('#myInput').focus();
    });


    //End

    var getUrlParameter = function getUrlParameter(sParam) {
        var sPageURL = decodeURIComponent(window.location.search.substring(1)),
            sURLVariables = sPageURL.split('&'),
            sParameterName,
            i;

        for (i = 0; i < sURLVariables.length; i++) {
            sParameterName = sURLVariables[i].split('=');

            if (sParameterName[0] === sParam) {
                return sParameterName[1] === undefined ? true : sParameterName[1];
            }
        }
    };

    var fb = getUrlParameter('facebook');
    if (fb !== undefined) {
        $('#fb-register').modal('show');

        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            'event': 'mioTracking',
            'mioTracking.category': 'Event Register',
            'mioTracking.action': 'Show Facebook Register Modal'
        });
    }

    // Facebook Register
    $('#fb-register-form').submit(function (event) {
        // get the form data
        // there are many ways to get this data using jQuery (you can use the class or id also)
        var formData = {
            'name': $('#fb-register-form input[name=name]').val(),
            'email': $('#fb-register-form input[name=email]').val(),
            'phone': $('#fb-register-form input[name=phone]').val(),
            'job_title': $('#fb-register-form input[name=job_title]').val(),
            'company': $('#fb-register-form input[name=company]').val(),
        };

        // process the form
        $.ajax({
            type: 'POST',
            url: 'fb_register.php',
            data: formData,
            dataType: 'json',
            encode: true
        })
            .done(function (data) {
                if (data.sent) {
                    window.dataLayer = window.dataLayer || [];
                    window.dataLayer.push({
                        'event': 'mioTracking',
                        'mioTracking.category': 'Event Register',
                        'mioTracking.action': 'Facebook Register Success'
                    });
                    $('#fb-register').modal('hide');
                    $('#fb-register-thankyou').modal('show');
                }
            });

        event.preventDefault();
    });

});





