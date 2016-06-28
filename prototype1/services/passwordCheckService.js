app.factory('passwordCheckService', function () {
    var passwordCheck = {};

    var lcL = /[a-z]+/;
    var upL = /[A-Z]+/;
    var num = /[0-9]+/;
    var ascii = /[\x21-\x2F\x3A-\x40\x5B-\x60\x7B-\xFF]+/;
    var unicode = /[^\x00-\xFF]+/;

    passwordCheck.classes = function (password) {
        var state = {};

        state.lcL = lcL.test(password);
        state.upL = upL.test(password);
        state.num = num.test(password);
        state.ascii = ascii.test(password);
        state.unicode = unicode.test(password);

        return state;
    };

    passwordCheck.rules = function (password, passwordRules) {
        var state = passwordCheck.classes(password);

        if (passwordRules.minimalLength != 0) {
            var min = new RegExp('[^]{' + passwordRules.minimalLength + ',}');
        }
        if (passwordRules.maximalLength != 0) {
            var max = new RegExp('^[^]{0,' + passwordRules.maximalLength + '}$');
        }

        if (passwordRules.allowedSymbols != '') {
            var onlyAllowed = new RegExp('^[a-zA-Z0-9' + passwordRules.allowedSymbols + ']+$');
        }
        if (passwordRules.forbiddenSymbols != '') {
            var forbidden = new RegExp('[' + passwordRules.forbiddenSymbols + ']+');
        }

        state.minL = !min || min.test(password);
        state.maxL = !max || max.test(password);
        state.onlyAllowed = !onlyAllowed || onlyAllowed.test(password);
        state.anyForbidden = !forbidden || !forbidden.test(password);

        if (passwordRules.complexity == 'basic') {
            state.complexEnough = true;
        } else {
            var count = 0;
            if (state.lcL) { count++; }
            if (state.upL) { count++; }
            if (state.num) { count++; }
            if (state.ascii) { count++; }
            if (state.unicode) { count++; }

            if (/^[1-9](?=class$)/.test(passwordRules.complexity)) { // match all "xclass" complexity
                state.complexEnough = count > (/^[1-9](?=class$)/.exec(passwordRules.complexity) - 1);
            }
            else if (passwordRules.complexity == 'idealo') {
                state.complexEnough = !/(.)\1{2}/.test(password);
            }
            else if (passwordRules.complexity == 'lidl') {
                state.complexEnough = new RegExp('[' + passwordRules.allowedSymbols + ']+').test(password);
            }
        }
        return state;
    };

    passwordCheck.nallowed = function (password, passwordRules) {
        var res = '';

        if (passwordRules.nonAlphanumeric == 0 && ascii.exec(password)) {
            var asciiMatch = ascii.exec(password)[0]
            res += asciiMatch;
        }
        if (passwordRules.unicodeCharacters == 0 && unicode.exec(password)) {
            var unicodeMatch = unicode.exec(password)[0];
            res += unicodeMatch;
        }

        if (passwordRules.allowedSymbols != '') {
            var allowedSymbols = passwordRules.allowedSymbols;
            if (asciiMatch) {
                // add all ascii characters to allowedSymbols string to avoid duplicate in res
                allowedSymbols += asciiMatch;
            }
            if (unicodeMatch) {
                // add all unicode characters to allowedSymbols string to avoid duplicate in res
                allowedSymbols += unicodeMatch;
            }
            var nallowed = new RegExp('[^a-zA-Z0-9' + allowedSymbols + ']+');
            if (nallowed.exec(password)) {
                res += nallowed.exec(password)[0];
            }
        }

        if (passwordRules.forbiddenSymbols != '') {
            var forbiddenSymbols = passwordRules.forbiddenSymbols;
            if (passwordRules.nonAlphanumeric == 0) {
                // remove all ascii characters from forbiddenSymbols string to avoid duplicate in res
                var forbiddenSymbols = forbiddenSymbols.replace(ascii, '');
            }
            if (passwordRules.unicodeCharacters == 0) {
                // remove all unicode characters from forbiddenSymbols string to avoid duplicate
                var forbiddenSymbols = forbiddenSymbols.replace(unicode, '');
            }
            var forbidden = new RegExp('[' + forbiddenSymbols + ']+');
            if (forbidden.exec(password)) {
                res += forbidden.exec(password)[0];
            }
        }

        return res;
    };

    return passwordCheck;
});