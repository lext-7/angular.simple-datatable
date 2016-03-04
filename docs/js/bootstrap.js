var simpleDatatable = window.simpleDatatable || {};

var app = angular.module('app', ['simpleDatatable']);


app.controller('ListCtrl', ['$scope', function (scope) {
    scope.list = simpleDatatable.testData;

    scope.selectAll = function () {
        angular.copy(scope.list, scope.sdtSelected);
    };

    scope.clearSelect = function () {
        scope.sdtSelected = [];
    };

    scope.sdtActionCols = [
        angular.element('#row-btn-1').html(),
        angular.element('#row-btn-2').html(),
    ];
    scope.currentActionCol = 1;

    scope.changeActionCol = function () {
        if (scope.currentActionCol === 0) {
            scope.currentActionCol = 1;
            scope.sdtActionCol = scope.sdtActionCols[1];
        } else {
            scope.currentActionCol = 0;
            scope.sdtActionCol = scope.sdtActionCols[0];
        }
    };

    scope.changeActionCol();

    scope.sdtOn = function (event, row) {
        var extraParams = Array.prototype.slice.call(arguments, 2);
        var log = 'row: ' + row.id + ' is clicked and event is ' + event + "\r\n"
                + JSON.stringify(extraParams);

        alert(log);
        if (event === 'remove') {
            var remover = extraParams[extraParams.length - 1];
            if (window.confirm('comfirm to  delete ?')) {
                remover();
            }
        }
    };

    window.s = scope;
}]);

angular.bootstrap(document.documentElement, ['app']);
