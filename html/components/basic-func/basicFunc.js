/**
 * @license
 * Copyright 2017 GIVe Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var GIVe = (function (give) {
  'use strict'

  /**
   * extend - Syntactic sugar for class inheritance
   *
   * @param  {object} base - Base class
   * @param  {object} sub  - Derived class
   */
  give.extend = function (base, sub) {
    sub.prototype = Object.create(base.prototype)
    sub.prototype.constructor = sub
    for (var key in base) {
      if (base.hasOwnProperty(key) && typeof base[key] === 'function') {
        if (!sub.hasOwnProperty(key) || typeof sub[key] !== 'function') {
          sub[key] = base[key]
        }
      }
    }
  }

  /**
   * getParameterByName - get parameters encoded in URL string
   * adapted from the following StackOverflow answer:
   * http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
   *
   * @param  {string} name - name of the parameter
   * @param  {string|null} url - url to be parsed, null to use the current
   *    parameter
   * @return {string} the parameter to be returned, '' if blank, null if not set
   */
  give.getParameterByName = function (name, url) {
    if (!url) {
      url = window.location.href
    }
    name = name.replace(/[[]]/g, '\\$&')
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)')
    var results = regex.exec(url)
    if (!results) return null
    if (!results[2]) return ''
    return decodeURIComponent(results[2].replace(/\+/g, ' '))
  }

  /**
   * forEach - implement Array.forEach onto array-like objects (for example,
   *    `window.NodeList`)
   *
   * @param  {object} array - array-like object, needs to have `.length` and
   *    numbered keys.
   * @param  {function} callback - call back function
   * @param  {object} [thisArg] - the `this` used in `callback`
   */
  give.forEach = function (array, callback, thisArg) {
    // this is for window.NodeList (and other array-like objects)
    for (var i = 0; i < array.length; i++) {
      callback.call(thisArg, array[i])
    }
  }

  /**
   * every - implement Array.every onto array-like objects (for example,
   *    `window.NodeList`)
   *
   * @param  {object} array - array-like object, needs to have `.length` and
   *    numbered keys.
   * @param  {function} callback - call back function
   * @param  {object} [thisArg] - the `this` used in `callback`
   * @return {boolean} if all elements in the array returned `true` in
   *    `callback`
   */
  give.every = function (array, callback, thisArg) {
    // this is for window.NodeList (and other array-like objects)
    for (var i = 0; i < array.length; i++) {
      if (!callback.call(thisArg, array[i])) {
        return false
      }
    }
    return true
  }

  /**
   * some - implement Array.some onto array-like objects (for example,
   *    `window.NodeList`)
   *
   * @param  {object} array - array-like object, needs to have `.length` and
   *    numbered keys.
   * @param  {function} callback - call back function
   * @param  {object} [thisArg] - the `this` used in `callback`
   * @return {boolean} if any element in the array returned `true` in
   *    `callback`
   */
  give.some = function (array, callback, thisArg) {
    // this is for window.NodeList (and other array-like objects)
    for (var i = 0; i < array.length; i++) {
      if (callback.call(thisArg, array[i])) {
        return true
      }
    }
    return false
  }

  give._debounceIDList = {}
  give._timeOutFunc = function (debounceList, jobName) {
    if (typeof debounceList[jobName].callbackFunc === 'function') {
      debounceList[jobName].callbackFunc()
    }
    delete debounceList[jobName]
  }

  give._addDebouncer = function (debounceList, jobName, callbackFunc, interval) {
    debounceList[jobName] = {
      timeOutHandle: window.setTimeout(
        give._timeOutFunc.bind(this, debounceList, jobName), interval),
      callbackFunc: callbackFunc
    }
  }

  give.debounce = function (jobName, callback, interval, immediate) {
    if (give._debounceIDList.hasOwnProperty(jobName)) {
      give._debounceIDList[jobName].callbackFunc = callback
    } else {
      if (immediate) {
        callback()
        give._addDebouncer(give._debounceIDList, jobName, null, interval)
      } else {
        give._addDebouncer(give._debounceIDList, jobName, callback, interval)
      }
    }
  }

  give.cancelDebouncer = function (jobName) {
    if (give._debounceIDList.hasOwnProperty(jobName)) {
      window.clearTimeout(give._debounceIDList[jobName].timeOutHandle)
      delete give._debounceIDList[jobName]
    }
  }

  give.isDebouncerActive = function (jobName) {
    return give._debounceIDList.hasOwnProperty(jobName)
  }

  give.compareNumbers = give.compareNumbers || function (x1, x2) {
    return x1 < x2 ? -1 : (x1 > x2 ? 1 : 0)
  }

  give.locationOf = give.locationOf || function (element, array, start, end, compareFunc) {
    // this is to return the index that element will be put AFTER
    // so if the element needs to be put to the top, it will return start-1
    if (array.length === 0) {
      return -1
    }

    start = start || 0
    end = end || array.length
    compareFunc = compareFunc || give.compareNumbers
    var pivot = parseInt((start + end) / 2) // = parseInt((start + end) / 2)

    var comp = compareFunc(element, array[pivot])
    if (end - start <= 1) {
      return (comp === -1) ? pivot - 1 : pivot
    }

    switch (comp) {
      case -1: return give.locationOf(element, array, start, pivot, compareFunc)
      case 0: return pivot
      case 1: return give.locationOf(element, array, pivot, end, compareFunc)
    }
  }

  give.postAjaxLegacy = give.postAjaxLegacy || function (
    target, params, responseFunc, responseType, method, errorFunc, thisVar
  ) {
    // this is a wrapper for Ajax calls throughout GIVe
    method = method || 'POST'
    var xhr = new window.XMLHttpRequest()
    xhr.responseType = responseType || ''
    xhr.onload = function () {
      var responses = xhr.response
      if (xhr.status >= 200 && xhr.status < 400) {
        if (xhr.responseType.toLowerCase() === 'json' &&
           (navigator.appName === 'Microsoft Internet Explorer' ||
          !!(navigator.userAgent.match(/Trident/) ||
             navigator.userAgent.match(/rv 11/)))) {
          // IE detected (should be IE 11), fix the json return issue
          let errorMsg = 'You are currently using IE 11 to visit this site. ' +
            'Some part of the site may behave differently and if you ' +
            'encounter any problems, please use the info on \'About us\' ' +
            'page to contact us.'
          give._verbConsole.error(errorMsg)
          give.fireSignal('warning', { msg: errorMsg })
          responses = JSON.parse(responses)
        }
        responseFunc.call(thisVar, responses, xhr.status)
      } else {
        if (errorFunc) {
          errorFunc.call(thisVar, xhr.status) // handle 404, 500 or other errors
        } else {
        }
      }
    }
    xhr.onerror = function () {
      if (errorFunc) {
        errorFunc.call(thisVar, xhr.status) // handle 404, 500 or other errors
      } else {
      }
      xhr.open(method, target)
      if (params instanceof window.FormData) {
        xhr.send(params)
      } else {
        xhr.setRequestHeader('Content-Type', 'application/json')
        xhr.send(JSON.stringify(params))
      }
    }
  }

  give.postAjax = give.postAjax || function (
    target, params, responseType, method
  ) {
    // this is a wrapper for Ajax calls throughout
    return new Promise((resolve, reject) => {
      method = method || 'POST'
      var xhr = new window.XMLHttpRequest()
      xhr.responseType = responseType || ''
      xhr.onload = function () {
        var responses = this.response
        if (this.status >= 200 && this.status < 400) {
          if (this.responseType.toLowerCase() === 'json' &&
             (navigator.appName === 'Microsoft Internet Explorer' ||
            !!(navigator.userAgent.match(/Trident/) ||
               navigator.userAgent.match(/rv 11/)))) {
            // IE detected (should be IE 11), fix the json return issue
            let errorMsg = 'You are currently using IE 11 to visit this site. ' +
              'Some part of the site may behave differently and if you ' +
              'encounter any problems, please use the info on \'About us\' ' +
              'page to contact us.'
            give._verbConsole.error(errorMsg)
            give.fireSignal('warning', { msg: errorMsg })
            responses = JSON.parse(responses)
          }
          resolve(responses)
        } else {
          reject(new give.GiveError('Connection error (' + this.status + ')' +
            this.response ? ': ' + this.response : ''))
        }
      }
      xhr.onerror = function () {
        reject(new give.GiveError('Connection error (' + this.status + ')' +
          this.response ? ': ' + this.response : ''))
      }
      xhr.open(method, target)
      if (params instanceof window.FormData) {
        xhr.send(params)
      } else {
        xhr.setRequestHeader('Content-Type', 'application/json')
        xhr.send(JSON.stringify(params))
      }
    })
  }

  give.fireCoreSignal = function (signame, sigdata) {
    // fire iron-signals
    give.fireSignal('iron-signal', {name: signame, data: sigdata},
      {bubbles: true, cancelable: true}, document.body)
  }

  give.fireSignal = function (evName, sigDetail, sigParams, elem) {
    var newEvent
    if (navigator.appName === 'Microsoft Internet Explorer' ||
        !!(navigator.userAgent.match(/Trident/) ||
           navigator.userAgent.match(/rv 11/))) {
      newEvent = document.createEvent('CustomEvent')
      newEvent.initCustomEvent(evName,
        sigParams && sigParams.bubbles,
        sigParams && sigParams.cancelable,
        sigDetail || null)
    } else {
      if (sigDetail) {
        sigParams = sigParams || {}
        sigParams.detail = sigDetail
      }
      newEvent = new window.CustomEvent(evName, sigParams)
    }
    ((elem && elem.dispatchEvent) ? elem : document).dispatchEvent(newEvent)
  }

  give.shortenString = function (str, limit, prefixLength, suffixLength) {
    prefixLength = prefixLength || 0
    suffixLength = suffixLength || 0
    if (str && str.length > limit) {
      return str.substr(0, prefixLength) + '...' + str.substr(str.length - suffixLength)
    } else {
      return str
    }
  }

  give._traverseData = function (
    data, currIndex, critFunc, thisVarCriteria, callback, thisVar
  ) {
    while (currIndex < data.length &&
      critFunc.call(thisVarCriteria, data[currIndex])
    ) {
      if (typeof callback === 'function') {
        callback.call(thisVar, data[currIndex])
      }
      currIndex++
    }
    return currIndex
  }

  give._findPercentile = function (dataArr, upperPercentile, lowerPercentile) {
    function numberComp (a, b) {
      return a - b
    }
    lowerPercentile = lowerPercentile || upperPercentile
    var sortedArr = dataArr.sort(numberComp)
    return {
      upper: sortedArr[parseInt(sortedArr.length * (1 - upperPercentile))],
      lower: sortedArr[parseInt(sortedArr.length * lowerPercentile)]
    }
  }

  give._maxDecimalDigits = function (number, digits) {
    return Number(Math.round(number + 'e' + digits) + 'e-' + digits)
  }

  give._copyTextToClipboard = function (text) {
    var textArea = document.createElement('textarea')
    textArea.textContent = text
    textArea.style.position = 'fixed'
    document.body.appendChild(textArea)
    textArea.select()
    try {
      return document.execCommand('copy')
    } catch (e) {
      give._verbConsole.warn(e)
      give.fireSignal('warning', { msg: 'Cannot copy code to clipboard.' })
      return false
    } finally {
      document.body.removeChild(textArea)
    }
  }

  give.comparePriorities = function (priorities1, priorities2) {
    for (let i = 0; i < priorities1.length; i++) {
      if (priorities2.length > i) {
        if (priorities1[i] !== priorities2[i]) {
          return Math.sign(priorities1[1] - priorities2[i])
        }
      } else {
        return 1
      }
    }
    return priorities2.length > priorities1.length ? -1 : 0
  }

  give._initDebug = function (isInDebug) {
    if (isInDebug || give.DEBUG) {
      /**
       * Provide _verbConsole support
       */
      give._verbConsole = {
        log: window.console.log.bind(window.console),
        error: window.console.error.bind(window.console),
        info: window.console.info.bind(window.console),
        warn: window.console.warn.bind(window.console)
      }

      /**
       * Create a customized error object
       */
      give.GiveError = class GiveError extends Error {
        constructor () {
          super(...arguments)
          if (Error.captureStackTrace) {
            Error.captureStackTrace(this, GiveError)
          }
        }
        toString () {
          return super.toString() + '\n' + this.stack
        }
      }
    } else {
      var _emptyFunc = () => {}
      give._verbConsole = {
        log: _emptyFunc,
        error: window.console.error.bind(window.console),
        info: _emptyFunc,
        warn: window.console.warn.bind(window.console)
      }
      give.GiveError = Error
    }
  }

  give._initDebug()

  window.addEventListener('WebComponentsReady', function (e) {
    give.fireCoreSignal('content-dom-ready', null)
    give.fireSignal(give.TASKSCHEDULER_EVENT_NAME, {flag: 'web-component-ready'})
  })

  return give
})(GIVe || {})
