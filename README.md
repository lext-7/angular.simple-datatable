# [angular simpleDatatable](https://lext-7.github.io/2016/03/16/angular-simple-datatable/)

----

a simple lib for angular datatable

[bootstrap demo](https://lext-7.github.io/angular.simple-datatable/docs/bootstrap.html)   
[semantic demo](https://lext-7.github.io/angular.simple-datatable/docs/semantic.html)

```
npm install angular.simple-datatable --save
```

```
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
```
