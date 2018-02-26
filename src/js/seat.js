;(function(window, document, Math){
  'use strict';
  var VERSION = '1.0.0'

  var ybSeatMap = {}

  // 检测是否支持passive选项
  var supportsPassiveOption = false
  try {
    var opts = Object.defineProperty({}, 'passive', {
      get: function () {
        supportsPassiveOption = true
      }
    })
    window.addEventListener('test', null, opts)
  } catch (e) {}

  function addEvent (el, type, method) {
    el.addEventListener(type, method, supportsPassiveOption ? { passive: false } : false)
  }

  function _findSeater (el) {
    var id
    while (el !== document) {
      id = el.getAttribute('seat-id')
      if (id) {
        return ybSeatMap[id]
      }
      el = el.parentNode
    }
    return null
  }

  function hasClass(obj, cls) {
    return obj.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
  }

  function addClass(obj, cls) {
    if (!hasClass(obj, cls)) obj.className += " " + cls;
  }

  function removeClass(obj, cls) {
    if (hasClass(obj, cls)) {
      var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
      obj.className = obj.className.replace(reg, '');
    }
  }

  function toggleClass(obj,cls){
    if(hasClass(obj,cls)){
      removeClass(obj, cls);
    }else{
      addClass(obj, cls);
    }
  }

  function parseDom(arg) {
    var objE = document.createElement("div");
    objE.innerHTML = arg;
    return objE.firstChild;
  }

  function _click(e) {
    e.stopPropagation()
    var yb = _findSeater(e.target), el = e.target
    while(!hasClass(el, yb.options.seatItemClass)){
      if(el === yb.container){
        el = null
        break
      }
      el = el.parentNode
    }
    if(el) {
      if(hasClass(el, 'selected')){
        removeClass(el, 'selected')
        if(typeof yb.options.cancelselected === 'function'){
          yb.options.cancelselected.call(yb, e)
        }
      }else{
        addClass(el, 'selected')
        if(typeof yb.options.onselected === 'function'){
          yb.options.onselected.call(yb, e)
        }
      }
      if(typeof yb.options.onclick === 'function'){
        yb.options.onclick.call(yb, e)
      }
    }
  }
  var YBSeat = function(el, options) {
    var me = this
    me.container = typeof el === 'string' ? document.querySelector(el) : el
    // 防止多次new
    if (me.ybseat) {
      return me
    } else {
      me.ybseat = true
    }
    me._init(el, options)
  }

  YBSeat.version = VERSION

  YBSeat.prototype = {
    _init: function(el, options) {
      var me = this
      //创建id
      me.id = (options && options.id) || 'seat_' + Math.random().toString().substr(2, 8)
      me.container.setAttribute('seat-id', me.id)
      //默认选项
      me.options = {
        seatItemClass: 'ybseat-item',
        space: 5,
        row: 10,
        col: 10,
        size: [30, 50],
        innerHtml: '<div class="list-item" \{attr\} >\{name\}</div>',
        onclick: null,
        cancelselected: null,
        onselected: null
      }
      me.data = []
      for(var i in options) {
        me.options[i] = options[i]
      }
      ybSeatMap[me.id] = me
      addEvent(me.container, 'click', _click)
      me.refresh(true)
    },
    refresh: function(reset) {
      var me = this
      if(reset) {
        me._createSeat()
      }else {
        for(var i=0;i<me.data.length;i++) {
          var item = me.data[i]
          var seat = me.container.querySelector('#'+item.seatId)
          if(seat) {
            addClass(seat, 'selected')
            if(item.name) {
              var name = item.name ? item.name : ''
              var attrTmp = item.attr ? item.attr : ''
              var attr = ''
              for (var item in attrTmp) {
                attr += item + "=" + attrTmp[item] + " ";
              }
              var htmlStr = me.options.innerHtml.replace('\{name\}', name)
              htmlStr = htmlStr.replace('\{attr\}', attr)
              seat.innerHTML = '<span>'+item.seatId.split('_')[1]+'</span>' + htmlStr
            }else {
              seat.innerHTML = '<span>'+item.seatId.split('_')[1]+'</span>'
            }
          }
        }
      }
    },
    setData: function(datalist) {
      var me = this
      if(datalist && datalist.length) {
        for(var i=0;i<datalist.length;i++) {
          var item = datalist[i]
          var seatList = me.data.filter(function(el) {
            return el.seatId == item.seatId
          })
          if(seatList.length) {
            for (var obj in item) {
              seatList[0][obj] = item[obj]
            }
          }else {
            me.data.push(item)
          }
        }
      }
    },
    getData: function(seatId) {
      var me = this
      if(seatId) {
        var seat = me.data.filter(function(el) {
          return el.seatId == seatId
        })
        if(seat.length) {
          return seat
        }else {
          return null
        }
      }else {
        return me.data
      }
    },
    deleteData: function(seatId) {
      var me = this
      for(var i=0;i<me.data.length;i++) {
        var item = me.data[i]
        if(item.seatId == seatId) {
          me.data[i] = {seatId: seatId}
        }
      }
      me.refresh(false)
    },
    clearData: function() {
      var me = this
      for(var i=0;i < me.data.length;i++) {
        me.data[i].name = '';
      }
    },
    _createSeat: function() {
      var me = this
      var row = me.options.row, col = me.options.col, space = me.options.space, size = me.options.size
      var seatItemClass = me.options.seatItemClass
      var htmlStr = [];
      var width = col * (size[0] + space);
      var height = row * (size[1] + space);
      me.container.style.width = width + 'px';
      me.container.style.height = height + 'px';
      for (var i = 0; i < row; i++) {
        var top = i * (space + size[1]);
        for (var j = 0; j < col; j++) {
          var left = j * (space + size[0]);
          var id = window.parseInt(i * col) + window.parseInt(j);
          htmlStr.push('<div class="'+seatItemClass+'" id="seatitem_' + id + '" style="position: absolute; cursor: pointer;width:' + size[0] + 'px;height:' + size[1] + 'px; top:' + top + 'px;left:' + left + 'px;"><span>' + id + '</span></div>');
          me.data.push({seatId: 'seatitem_' + id, name: ''})
        }
      }
      me.container.innerHTML = htmlStr.join('');
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = YBSeat
  }
  if (typeof define === 'function') {
    define(function () {
      return YBSeat
    })
  }
  window.YBSeat = YBSeat;
})(window, document, Math);