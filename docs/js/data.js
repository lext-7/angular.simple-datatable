var simpleDatatable = window.simpleDatatable || {};

simpleDatatable.testData = (function () {
    var data = [];
    for (var i = 0; i < 100; i++) {
        data.push({
            id: i,
            string: 'name' + i,
            img: 'https://github.com/fluidicon.png',
            bool: (i % 2) == 0,
            time: Date.now(),
            arr: [1, 2, 3, 4, i]
        });
    }
    return data;
})();
