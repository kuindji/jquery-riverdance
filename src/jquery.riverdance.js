

(function($){

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

    var sequence   = function(frames, startTime) {

        var position    = 0,
            length      = frames.length,
            step        = function() {
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
            };

        requestAnimationFrame(step);
    };

    var getClass = function(className) {
        var classes = document.styleSheets[0].rules || document.styleSheets[0].cssRules;
        for(var x=0;x<classes.length;x++) {
            if(classes[x].selectorText==className) {
                return classes[x].cssText || classes[x].style.cssText;
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

    $.fn.riverdance = function(options) {

        options = options || {};

        this.each(function() {

            var node        = this,
                text        = node.innerText || node.textContent,
                position    = 0,
                length      = text.length,
                left        = document.createTextNode(""),
                right       = document.createTextNode(text),
                speed       = options.speed || 30,
                cls         = options.cls,
                defDuration = (cls ? getMaxDuration(cls) : null) || options.stepDuration || 200,
                stages      = options.stages ? getStagesDuration(options.stages, defDuration) : null,
                duration    = stages ? getDurationSum(stages) : defDuration,
                last        = (new Date).getTime();

            var skip        = function(index, startTime, cb) {
                return function() {

                    var letter  = document.createTextNode(text[index]);
                    letter.nodeValue    = text[index];
                    right.nodeValue     = right.nodeValue.substr(1);
                    node.insertBefore(letter, right);

                    sequence([
                        [0, function(){}],
                        [duration, function() {
                            left.nodeValue += (letter.innerText || letter.textContent);
                            node.removeChild(letter);
                            if (cb) {
                                cb();
                            }
                        }]
                    ], startTime);
                };
            };

            var process     = function(index, startTime, cb) {
                return function() {

                    var letter  = document.createElement("span"),
                        steps   = [],
                        dur     = 0,
                        i, len,
                        endthis  = function() {
                            left.nodeValue      += (letter.innerText || letter.textContent);
                            node.removeChild(letter);
                            if (cb) {
                                cb();
                            }
                        };

                    letter.style.display    = "inline-block";
                    letter.style.fontSize   = "inherit";
                    letter.style.lineHeight = "inherit";
                    letter.className    = cls;
                    letter.innerHTML    = text[index];
                    right.nodeValue     = right.nodeValue.substr(1);
                    node.insertBefore(letter, right);

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
                        sequence(steps, startTime);
                    }
                    else {
                        sequence([[duration, endthis]], startTime);
                    }
                };
            };

            var finish      = function() {
                node.innerHTML = text;
            };

            var step        = function() {

                var time    = (new Date).getTime();

                if (time - last >= speed) {

                    if (trim(text[position])) {
                        process(position, time, position == length - 1 ? finish : null)();
                    }
                    else {
                        skip(position, time, position == length - 1 ? finish : null)();
                    }

                    position++;
                    last = time;
                }

                if (position < length) {
                    requestAnimationFrame(step);
                }
            };

            while (node.firstChild) {
                node.removeChild(node.firstChild);
            }

            node.appendChild(left);
            node.appendChild(right);


            requestAnimationFrame(step);
        });

        return this;
    };


}(jQuery));