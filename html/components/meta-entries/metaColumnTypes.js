// JavaScript Document
var GIVe = (function (give) {
  'use strict'

  give.MetaColumnTypes = function (url) {
    this.url = url || give.MetaColumnTypes.defaultUrl
    this.isReady = false
    this.entries = {}
    give.postAjax(this.url, null, this.responseHandler, 'text', 'GET', null, this)
  }

  give.MetaColumnTypes.prototype.responseHandler = function (data) {

  }

  give.MetaColumnTypes.defaultUrl = '/genemo-comp/getAllMeta.php'

  return give
})(GIVe || {})
