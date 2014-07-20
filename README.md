#jQuery.riverdance.js
jQuery plugin for running css animations on each letter in a text

[Examples](http://kuindji.com/js/jquery-riverdance/demo.html)

2k minified

##Options

```js
$("elem").riverdance({
    cls: "...", //  required initial class
    stages: [], // optional css stages
    speed: 30, // optional ms per letter speed
    stepDuration: 200 // optional duration of every step (determined automatically from css)
});
```