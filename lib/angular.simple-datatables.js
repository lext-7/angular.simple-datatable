var simpleDataTable = angular.module('simpleDatatable', []);

angular.element('<style>' +
    '.sdt-orderby { position: relative !important; }' +
    '.sdt-orderby-desc { position: relative !important; }' +
    '.sdt-orderby:after{content: ""; position: absolute; top: 50%; margin-top: -12px; right:8px; border-style: solid; border-width: 8px; border-color: transparent transparent #008080 transparent; }' +
    '.sdt-orderby-desc:after{content: ""; position: absolute; bottom: 50%; margin-bottom: -12px; right:8px; border-style: solid; border-width: 8px; border-color: #008080 transparent transparent transparent; }' +
    '</style>').appendTo('head');

/**
 * get property value from an object
 * @param  object $parse      angular $parse provider
 * @param  object ctx         object
 * @param  string propertyStr property name if '$this', it return object itself.
 * @return mixture
 *
 * $parse; // angulat $parse provider
 * var obj = {
 * 		a: 'hello',
 * 		b: [1, 2, 3]
 * };
 * getProperty($parse, obj, 'a'); // => 'hello'
 * getProperty($parse, obj, 'b.length'); // => 3
 *
 * obj = 'string value';
 * getProperty($parse, obj, '$this'); // => 'string value'
 */
var getProperty = function ($parse, ctx, propertyStr) {
    if (propertyStr === '$this') {
        return ctx;
    }
    var getter = $parse(propertyStr);
    return getter(ctx);
};

var find = function (collection, filter) {
    for (var i in collection) {
        var item = collection[i];
        if (filter(item)) {
            return {
                item: item,
                index: i
            };
        }
    }
};

var quickSortBy = function ($parse, arr, property, compare, reverse) {
    if (arr.length <= 1) {
        return arr;
    }
    var pivotIndex = Math.floor(arr.length / 2);
    var pivot = arr.splice(pivotIndex, 1)[0];
    var pivotVal = getProperty($parse, pivot, property);
    var left = [];
    var right = [];
    for (var i = 0; i < arr.length; i++) {
        var compareResult;
        var item = getProperty($parse, arr[i], property);
        if (typeof compare === 'function') {
            compareResult = compare(item, pivotVal);
        } else {
            compareResult = item < pivotVal;
        }
        if (reverse) {
            compareResult = !compareResult;
        }
        if (compareResult) {
            left.push(arr[i]);
        } else {
            right.push(arr[i]);
        }
    }
    return quickSortBy($parse, left, property, compare, reverse).concat([pivot], quickSortBy($parse, right, property, compare, reverse));
};

simpleDataTable.filter('property', ['$parse', '$sce', function ($parse, $sce) {
    return function (ctx, propertyStr, type) {
        var val = getProperty($parse, ctx, propertyStr);
        val = typeof val === 'undefined' || val === null ? '' : val;
        if (type == 'Date') {
            return new Date(val);
        } else if (type === 'Bool') {
            return val;
        } else {
            return $sce.trustAsHtml(val.toString());
        }
    };
}]);

/**
 *
 * @param [Array] [required]    ngModel   the list source to generate table
 * @param [String]  sdtRowId  the primary key of each row
 * @param [String]  sdtActionCol  the last row for operation
 * @param [Int] sdtPerPage    how many items show in a page
 * @param [Function]    sdtOn event handle
 * @param [Array]   sdtSelected   array for items selected
 * @param [Bool]    sdtKeepSelected whether the selected will be keepped selected when turning to another page
 * @directive [Attribute]   sdt-col-type  [string | date | datetime | bool | img | selectbox]
 *            when sdt-col-type is bool  sdt-bool-true will be the true value sdt-bool-false will be the false value
 *            when sdt-col-type is img, it will generate img tag automatically
 *            when sdt-col-type is selectbox, sdt-col will be ignored, the sdtSelectboxHtml will be use to  generate the select box.
 *            		by default, sdtSelectboxHtml => '<input type="checkbox" ng-checked="isRowSelected(row) != -1" >'
 *            	 	you can change it to "<i class="fa {{isRowSelected(row)} != -1 ? 'fa-check-square-o' : 'fa-square-o'}"></i>"
 * @directive [Attribute]   sdt-search-input
 * @directive [Attribute]   sdt-search-btn
 * @directive [Attribute]   sdt-page-input
 * @directive [Attribute]   sdt-page-btn
 * @directive [Attribute]   sdt-page    current page output
 * @directive [Attribute]   sdt-total-page    total page output
 * @directive [Attribute]   sdt-total-label    total item number output
 * @directive [Attribute]   sdt-prev-btn
 * @directive [Attribute]   sdt-next-btn
 * @directive [Attribute]   sdt-row-click   [eventName, yourParams1, ...]  it will emit to sdtOn(eventName, row, yourParams1, ..., [removeFunc]) if eventName is 'remove', the last callback param is removeFunc, removeFunc() will remove the row
 * <!-- {{}} means something you need to change -->
 * <table>
 * 		<thead>
 * 			<th sdt-col="{{rowKey}}" sdt-col-type>{{rowName}}</th>
 * 			<th sdt-col="boolKey" sdt-col-type="bool" sdt-bool-true="{{trueText}}" sdt-bool-false="{{falseText}}">{{rowName}}</th>
 * 		</thead>
 * 		<tbody>
 * 		</tbody>
 * </table>
 */
simpleDataTable.directive('simpleDatatable', function () {
    return {
        restrict: "A",
        require: [
            "ngModel",
            "?sdtRowId",
            '?sdtActionCol',
            '?sdtPerPage',
            '?sdtOn',
            '?sdtSelected',
            '?sdtKeepSelected',
            '?sdtSelectboxHtml'
        ],
        scope: {
            ngModel: '=',
            sdtOn: '=',
            sdtActionCol: '=',
            sdtRowId: '@',
            sdtPerPage: '@',
            sdtSelected: '=',
            sdtKeepSelected: '@',
            sdtSelectboxHtml: '@'
        },
        controller: ['$scope', '$element', '$compile', '$parse', '$sce', function (scope, element, $compile, $parse, $sce) {

            // elements
            var table = element.find('table'),
                ths = table.find('thead th'),
                tbody = table.find('tbody');

            if (!scope.ngModel) {
                scope.ngModel = [];
                console.warn('please set ng-model in simple-datatable')
            }

            // scope init
            var defaultPerPage = 10;
            scope.page = 1;
            scope.pageInput = scope.page;
            scope.sdtPerPage = scope.sdtPerPage || defaultPerPage;
            scope.list = [];
            scope.currentList = [];
            scope.totalPage = Math.ceil(scope.ngModel.length / scope.sdtPerPage);
            scope.sortCol = undefined;
            scope.sortColReverse = false;
            scope.sdtRowId = scope.sdtRowId || 'id';


            scope.sdtSelected = scope.sdtSelected || [];

            scope.sdtSelectboxHtml = $sce.trustAsHtml(scope.sdtSelectboxHtml || '<input type="checkbox" ng-checked="isRowSelected(row) != -1" >');

            angular.copy(scope.ngModel, scope.list);

            // scope
            scope.colAttrs = [];
            ths.each(function (index, ele) {
                ele = angular.element(ele);
                var attrs = {};
                attrs.name = ele.attr('sdt-col');
                attrs.type = ele.attr('sdt-col-type');
                if (!attrs.type) {
                    attrs.type = 'string';
                }
                if (attrs.type === 'bool') {
                    attrs.true = ele.attr('sdt-bool-true');
                    attrs.false = ele.attr('sdt-bool-false');
                }
                if (attrs.name) {
                    scope.colAttrs.push(attrs);
                    index = scope.colAttrs.length - 1;
                    ele.attr('ng-click', 'sort(' + index + ', sortCol == ' + index + ')');
                    ele.attr('class', ele.attr('class') + ' {{ sortCol == ' + index + ' ? (sortColReverse ? "sdt-orderby-desc" : "sdt-orderby" ) : ""}} ');
                    //var sortType = ele.attr('sdt-sort-type');
                    //switch (sortType) {
                    //    case 'number': {
                    //        scope.colSortType.push(function (item, pivot) {
                    //          return parseFloat(item) < pivot;
                    //        })
                    //    }
                    //    default :{
                    //        scope.colSortType.push(undefined);
                    //    }
                    //}
                }
                ele.css('cursor', 'pointer');
            });
            $compile(ths)(scope);

            scope.goto = function (page) {

                if (page) {
                    if (page < 1) {
                        page = 1;
                    }
                    if (page * scope.sdtPerPage > scope.list.length) {
                        page = scope.totalPage;
                    }
                    scope.page = page;
                }
                scope.currentList = scope.list.slice((scope.page - 1) * scope.sdtPerPage, scope.page * scope.sdtPerPage);
                scope.$applyAsync();
            };

            scope.click = function (index, event) {

                var row = scope.currentList[index];
                var params = [event, row].concat(Array.prototype.slice.call(arguments, 2));
                if (event === 'remove') {
                    var item = find(scope.ngModel, function (item) {
                        return item[scope.sdtRowId] == row.id;
                    });
                    if (item) {
                        if (typeof scope.sdtOn === 'function') {
                            scope.sdtOn.apply(null, params.concat([remove]));
                        } else {
                            remove();
                        }
                        function remove() {
                            scope.ngModel.splice(item.index, 1);
                            scope.$applyAsync();
                        }
                    }
                    return;
                }
                if (typeof scope.sdtOn === 'function') {
                    scope.sdtOn.apply(null, params);
                }
            };

            window.sdt = scope;

            scope.sort = function (index, reverse) {
                if (typeof  index === 'undefined') {
                    return;
                }

                if (scope.sortCol === index && scope.sortColReverse === reverse) {
                    reverse = !reverse;
                }
                scope.sortColReverse = reverse;
                var col = scope.colAttrs[index].name;
                scope.list = quickSortBy($parse, scope.list, col, undefined, reverse/*, scope.colSortType[index]*/);
                scope.sortCol = index;
            };

            var lastSearch;
            scope.search = function () {
                var searchText = scope.searchInput;

                var list = [];
                for (var i = 0; i < scope.ngModel.length; i++) {
                    var item = scope.ngModel[i];
                    for(var colIndex = 0; colIndex < scope.colAttrs.length; colIndex ++ ) {
                        var col = scope.colAttrs[colIndex];
                        try {
                            if (getProperty($parse, item, col.name).toString().indexOf(searchText) !== -1) {
                                list.push(item);
                                break;
                            }
                        } catch (e) {

                        }
                    }
                }
                scope.page = 1;
                scope.list = list;
                lastSearch = searchText;
                scope.sort(scope.sortCol, false);
            };

            scope.select = function (row) {
                var index = scope.isRowSelected(row);
                if (index === -1) {
                    scope.sdtSelected.push(row);
                } else {
                    scope.sdtSelected.splice(index, 1);
                }
            };

            // watch
            scope.$watch('[page, sdtPerPage, sortCol]', function (newVal, oldVal) {
                if (!newVal[1]) {
                    scope.sdtPerPage = defaultPerPage;
                }
                if (oldVal[0] === newVal[0] && oldVal[1] === newVal[1] && oldVal[2] === newVal[2]) {
                    return;
                }
                if (oldVal[0] !== newVal[0]) {
                    scope.pageInput = scope.page;
                    if (!scope.sdtKeepSelected) {
                        scope.sdtSelected = [];
                    }
                }
                if (!scope.sdtPerPage) {
                    scope.sdtPerPage = defaultPerPage;
                }
                scope.goto();
            });

            scope.$watchCollection('list', function (newVal, oldVal) {
                if (angular.equals(oldVal, newVal)) {
                    return;
                }
                scope.totalPage = Math.ceil(scope.list.length / scope.sdtPerPage);

                scope.goto();
            });

            scope.isRowSelected = function (row) {
                for(var index = 0; index < scope.sdtSelected.length; index ++) {
                    if (scope.sdtSelected[index][scope.sdtRowId] === row[scope.sdtRowId]) {
                        return index;
                    }
                }
                return -1;
            };

            scope.trWrapper = function () {
                var str = '' +
                    '<tr ng-repeat="row in currentList track by $index" class="{{isRowSelected(row) != -1? \'sdt-row-selected\' : \'\'}}">' +
                        '<td ng-repeat="rowAttr in colAttrs track by $index"" >' +
                        //'{{row | property: name}}' +
                            '<span ng-bind-html="row | property: rowAttr.name" ng-if="[\'string\'].indexOf(rowAttr.type) != -1"></span>' +
                            '<img ng-src="{{row | property: rowAttr.name}}" ng-if="rowAttr.type == \'img\'">' +
                            '<span ng-if="rowAttr.type == \'selectbox\'" ng-click="select(row)">' + scope.sdtSelectboxHtml + '</span>' +
                            '<span ng-if="rowAttr.type == \'date\'">{{ (row | property: rowAttr.name : "Date") | date: "yyyy/MM/dd"}}</span>' +
                            '<span ng-if="rowAttr.type == \'datetime\'">{{row | property: rowAttr.name:  "Date" | date: "yyyy/MM/dd hh:mm"}}</span>' +
                            '<span ng-if="rowAttr.type == \'bool\'">{{ (row | property: rowAttr.name : "Bool") ? rowAttr.true : rowAttr.false}}</span>' +
                        '</td>';
                if (scope.sdtActionCol) {
                    var actionCol = scope.sdtActionCol;
                    actionCol = actionCol.replace('sdt-row-remove', "ng-click='click($index, \"remove\")'");
                    actionCol = actionCol.replace(/sdt-row-click="(.*?)"/g, function (searchValue, replaceValue) {
                        return "ng-click='click($index, " + replaceValue.split(',').map(function (item) {
                                return "\"" + item.trim() + "\"";
                            }).join(',') + ")'";
                    });
                    str += actionCol;
                }
                str += "</tr>";
                tbody.html($compile(str)(scope));
            };

            scope.$watchCollection('ngModel', function (newVal, oldVal) {
                if (angular.equals(oldVal, newVal)) {
                    return;
                }
                scope.search();
            });

            scope.$watchCollection('sdtActionCol', function (newVal, oldVal) {
                if (angular.equals(oldVal, newVal)) {
                    return;
                }
                scope.trWrapper();
            });

            // init action
            scope.goto(1);


            // env bind
            // draw tr
            scope.trWrapper();


            // bind search event
            scope.searchInput = '';
            var searchInput = element.find('[sdt-search-input]');
            searchInput.attr('ng-model', 'searchInput');
            searchInput.attr('ng-keydown', '$event.keyCode === 13 && search()');
            $compile(searchInput)(scope);

            var searchBtn = element.find('[sdt-search-btn]');
            searchBtn.attr('ng-click', 'search()');
            $compile(searchBtn)(scope);

            //
            var totalLabel = element.find('[sdt-total-label]');
            totalLabel.html('{{list.length}}');
            $compile(totalLabel)(scope);

            var totalPageLabel = element.find('[sdt-total-page]');
            totalPageLabel.html('{{totalPage}}');
            $compile(totalPageLabel)(scope);

            var pageLabel = element.find('[sdt-page]');
            pageLabel.html('{{page}}');
            $compile(pageLabel)(scope);

            var pageInput = element.find('[sdt-page-input]');
            pageInput.attr('ng-model', 'pageInput');
            pageInput.attr('max', '{{totalPage}}');
            $compile(pageInput)(scope);

            var pageBtn = element.find('[sdt-page-btn]');
            pageBtn.attr('ng-click', 'goto(pageInput)');
            $compile(pageBtn)(scope);

            pageBtn = element.find('[sdt-prev-btn]');
            pageBtn.attr('ng-click', 'goto(page - 1)');
            pageBtn.attr('ng-show', 'page != 1 && totalPage != 0');
            $compile(pageBtn)(scope);

            pageBtn = element.find('[sdt-next-btn]');
            pageBtn.attr('ng-click', 'goto(page + 1)');
            pageBtn.attr('ng-show', 'page < totalPage');
            $compile(pageBtn)(scope);

            scope.$applyAsync();

        }]
    };
});
