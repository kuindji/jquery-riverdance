#jQuery.riverdance.js
jQuery plugin for running css animations on each letter in a text

[Examples](http://kuindji.com/js/jquery-riverdance/demo.html)

2k minified

##Options

```js
$("elem").riverdance({
    cls: "...", //  required initial class
    allCls: "", // optional class to apply to the element during the process
    stages: [], // optional css stages
    speed: 30, // optional ms per letter speed
    reverse: false, // optional; true to start from the right
    stepDuration: 200, // optional duration of every step (determined automatically from css)
    hideBefore: false, // optional flag to hide letters until animated
    hideAfter: false, // optional flag to hide letters after animated
    callback: null, // optional callback function to call after all animations
    text: "", // optional replacement text
    loop: false|number, // repeat process indefinitely (true) or number of times
    loopDelay: 0, // number of ms
    loopReverse: false // reverse on each iteration
});
```