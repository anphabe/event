var app_url = 'https://www.anphabe.com/aapi-lead/register';
 /** Anphabe function */
 function updateUtmInput() {
    let query = window.location.search;  
    let searchParams = new URLSearchParams(query);
    if ( searchParams.has("utm_campaign")) {
        jQuery('[name ="utm_campaign"]').val(searchParams.get("utm_campaign"));
    }
    if ( searchParams.has("utm_source")) {
        jQuery('[name ="utm_source"]').val(searchParams.get("utm_source"));
    }
    if ( searchParams.has("utm_medium")) {
        jQuery('[name ="utm_medium"]').val(searchParams.get("utm_medium"));
    }
    if ( searchParams.has("utm_term")) {
        jQuery('[name ="utm_term"]').val(searchParams.get("utm_term"));
    }
    if ( searchParams.has("utm_content")) {
        jQuery('[name ="utm_content"]').val(searchParams.get("utm_content"));
    }
}

jQuery(function ($) {
    $(document).ready(function () {
       
        updateUtmInput();

        $('input[data-required="true"]').blur(function () {
            validationRequiredElement($(this))
        })
        $('input[name="email"]').blur(function () {
            validationEmailField($(this));
        })

        $(".form-register").submit(function (e) {
            e.stopPropagation();
            e.preventDefault();
            var error = validation();

            if (error) {
                $('html, body').animate({
                    scrollTop: ($(".has-warning").first().offset().top - 20)
                }, 500);
                $('.form-control-warning').first().focus();

                return false;
            }

            else {
                $('[type="submit"]').addClass('disabled');
                dataString = $(".form-register").serialize();
                $.ajax({
                    type: "POST",
                    url: app_url,
                    data: dataString,
                    dataType: "json",
                    cache: false,
                    success: function (data) {
                        if (data.response) {
                            $('#dangky_thanhcong').modal('show');
                            $('[type="submit"]').removeClass('disabled');
                        }
                        else {
                            $('#error_message').modal('show');
                        }
                    },
                    error: function (error) {
                    }
                });
            }
            return false;
        });


    }); // end function document ready

    function validationEmailFormat(emailtest) {
        var vari_email = /^[\w\-\.\+]+\@[a-zA-Z0-9\.\-]+\.[a-zA-z0-9]{2,4}$/;
        return vari_email.test(emailtest);
    }


    function validationEmailField(email_input) {
        var error = false;
        if (!validationEmailFormat(email_input.val())) {
            if (!email_input.hasClass('form-control-warning')) {
                $(email_input).closest('.form-group').addClass('has-warning');
                $(email_input).addClass('form-control-warning');
                $(email_input).after('<div class="form-control-feedback text-danger">Email không hợp lệ!</div>');
            }

            error = true;
        }
        else {
            if (email_input.hasClass('form-control-warning')) {
                email_input.closest('.form-group').removeClass('has-warning');
                email_input.removeClass('form-control-warning');
                email_input.next('.form-control-feedback').remove();
            }

            email_input.closest('.form-group').addClass('has-success');
            email_input.addClass('form-control-success');

        }
        return error;
    }

    function validationRequiredElement(element) {
        var error = false;
        if (!element.val()) {
            if (!element.hasClass('form-control-warning')) {
                element.closest('.form-group').addClass('has-warning');
                element.addClass('form-control-warning');
                element.after('<div class="form-control-feedback text-danger">Đây là thông tin bắt buộc!</div>');
            }

            error = true;
        }
        else if (element.val()) {
            if (element.hasClass('form-control-warning')) {
                element.closest('.form-group').removeClass('has-warning');
                element.removeClass('form-control-warning');
                element.next('.form-control-feedback').remove();
            }

            element.closest('.form-group').addClass('has-success');
            element.addClass('form-control-success');

        }
        return error;
    }

    function validationRequiredFields() {
        var error = false;
        $('input[data-required="true"]:visible').each(function (index, element) {
            var valid = validationRequiredElement($(this));
            error = error || valid;
        });
        return error;
    }

    function validation() {
        error2 = validationRequiredFields();
        error3 = validationEmailField($('input[name="email"]'));
        return error2 || error3;
    }

});