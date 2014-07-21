

(function($){

    var uid = 1;

    var trim =(function() {
        // native trim is way faster: http://jsperf.com/angular-trim-test
        // but IE doesn't have it... :-(
        if (!String.prototype.trim) {
            return function(value) {
                return typeof value == "string" ? value.replace(/^\s\s*/, '').replace(/\s\s*$/, '') : value;
            };
        }
        return function(value) {
            return typeof value == "string" ? value.trim() : value;
        };
    })();

    var sequence   = function(frames, startTime, validFn) {

        var position    = 0,
            length      = frames.length,
            step        = function() {

                if (validFn()) {
                    var time    = (new Date).getTime(),
                        frame   = frames[position];

                    if (time - startTime >= frame[0]) {
                        frame[1](time, position);
                        startTime = time;
                        position++;
                    }

                    if (position < length) {
                        requestAnimationFrame(step);
                    }
                }
            };

        requestAnimationFrame(step);
    };

    var getClass = function(className) {
        var sheets  = document.styleSheets,
            sheet, classes,
            i, len;

        for (i = 0, len = sheets.length; i < len; i++) {
            sheet   = sheets[i];
            classes = sheet.rules || sheet.cssRules;
            for(var x=0;x<classes.length;x++) {
                if(classes[x].selectorText==className) {
                    return classes[x].cssText || classes[x].style.cssText;
                }
            }
        }

        return "";
    };

    var getMaxDuration = function(className) {

        var css     = getClass("."+className),
            matches = css.match(/(\d*\.?\d+)(m?s)/g),
            i, len,
            times   = [],
            time;

        if (!matches) {
            return null;
        }

        for (i = 0, len = matches.length; i < len; i++) {
            time = parseFloat(matches[i]);
            if (matches[i].indexOf("ms") == -1) {
                time *= 1000;
            }
            times.push(time);
        }

        if (!times.length) {
            return null;
        }

        times.sort();
        return times.pop();
    };

    var getStagesDuration = function(classes, def) {
        var stages = [],
            i, len, dur, cls;

        for (i = 0, len = classes.length; i < len; i++) {
            cls = classes[i];
            dur = getMaxDuration(cls);
            stages.push([dur === null ? def : dur, cls]);
        }

        return stages;
    };

    var getDurationSum = function(stages) {
        var sum = 0, i, len;

        for (i = 0, len = stages.length; i < len; i++) {
            sum += stages[i][0];
        }

        return sum;
    };

    var EMPTY = "\u200C";

    $.fn.riverdance = function(options) {

        var stop        = options == "stop";

        options = stop ? {} : options || {};

        var speed       = options.speed || 30,
            cls         = options.cls,
            hideBefore  = options.hideBefore || false,
            hideAfter   = options.hideAfter || false,
            loop        = options.loop || false,
            loopDelay   = options.loopDelay || null,
            defDuration = (cls ? getMaxDuration(cls) : null) || options.stepDuration || 200,
            stages      = options.stages ? getStagesDuration(options.stages, defDuration) : null,
            duration    = stages ? getDurationSum(stages) : defDuration;

        this.each(function() {

            var node        = this,
                el          = $(node),
                text        = options.text || node.innerText || node.textContent,
                position    = 0,
                length      = text.length,
                reverse     = options.reverse || false,
                id          = uid++,
                left,
                right,
                last;

            var stillValid      = function() {
                return el.data("riverdance") === id;
            };

            var createLetter    = function(inx) {

                var letter, char = text[inx];

                if (!trim(char)) {
                    char = "&nbsp;";
                }
                letter  = document.createElement("span");
                letter.innerHTML = char;
                letter.style.display    = "inline-block";
                letter.style.fontSize   = "inherit";
                letter.style.lineHeight = "inherit";
                letter.className = cls;


                if (!hideBefore) {
                    if (!reverse) {
                        right.nodeValue = right.nodeValue.substr(1);
                    }
                    else {
                        left.nodeValue = text.substring(0, inx);
                    }
                }

                if (!reverse) {
                    node.insertBefore(letter, right);
                }
                else {
                    node.insertBefore(letter, left.nextSibling);
                }

                return letter;
            };

            var removeLetter    = function(letter, inx) {

                if (letter && letter.parentNode === node) {
                    node.removeChild(letter);
                }

                if (!hideAfter) {
                    if (!reverse) {
                        left.nodeValue += text[inx];
                    }
                    else {
                        right.nodeValue = text.substr(inx);
                    }
                }
            };

            var process     = function(index, startTime, cb) {
                return function() {

                    var letter  = createLetter(index),
                        steps   = [],
                        dur     = 0,
                        i, len,
                        endthis  = function() {
                            removeLetter(letter, index);
                            if (cb) {
                                cb();
                            }
                        };

                    if (stages) {
                        for (i = 0, len = stages.length; i < len; i++) {
                            steps.push([dur, function(stepCls){
                                return function() {
                                    letter.className = cls + " " + stepCls;
                                }
                            }(stages[i][1])]);
                            dur = stages[i][0];
                        }
                        steps.push([dur, endthis]);
                        sequence(steps, startTime, stillValid);
                    }
                    else {
                        sequence([[duration, endthis]], startTime, stillValid);
                    }
                };
            };

            var finish      = function() {

                if (stillValid()) {

                    if (!hideAfter) {
                        node.innerHTML = text;
                    }
                    else {
                        node.innerHTML = "\u200C";
                    }

                    if (options.allCls) {
                        el.removeClass(options.allCls);
                    }

                    if (options.callback) {
                        options.callback();
                    }

                    if (loop) {

                        if (options.loopReverse) {
                            reverse = !reverse;
                        }

                        window.setTimeout(start, loopDelay || 0);

                        if (loop !== true) {
                            loop--;
                        }
                    }
                }
                else {
                    abort();
                }
            };

            var abort       = function() {

                if (!el.data("riverdance")) {
                    if (!hideAfter) {
                        node.innerHTML = text;
                    }
                    else {
                        node.innerHTML = "\u200C";
                    }

                    if (options.callback) {
                        options.callback();
                    }
                }

                if (options.allCls) {
                    el.removeClass(options.allCls);
                }
            };

            var step        = function() {

                if (stillValid()) {

                    var time            = (new Date).getTime(),
                        lastPosition    = reverse ? (position == 0) : (position == length - 1),
                        afterLast       = reverse ? (position < 0) : (position >= length);

                    if (time - last >= speed) {
                        process(position, time, lastPosition ? finish : null)();
                        position += (reverse ? -1 : 1);
                        last = time;
                    }

                    if (!afterLast) {
                        requestAnimationFrame(step);
                    }
                }
                else {
                    abort();
                }
            };

            var start = function() {

                if (options.allCls) {
                    el.addClass(options.allCls);
                }

                while (node.firstChild) {
                    node.removeChild(node.firstChild);
                }

                left        = document.createTextNode(reverse ? text : "");
                right       = document.createTextNode(reverse ? "" : text);
                last        = (new Date).getTime();
                position    = reverse ? text.length - 1 : 0;

                if (hideBefore) {
                    if (reverse) {
                        left.nodeValue = EMPTY;
                    }
                    else {
                        right.nodeValue = EMPTY;
                    }
                }
                node.appendChild(left);
                node.appendChild(right);

                requestAnimationFrame(step);
            };

            if (stop) {
                el.data("riverdance", null);
            }
            else {
                el.data("riverdance", id);
                start();
            }
        });

        return this;
    };


}(jQuery));