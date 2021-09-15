/**
 * @description DOM 操作
 * @komorebi
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
/* eslint-disable @typescript-eslint/ban-types */
function toArray(likeArr) {
    return Array.from(likeArr);
}
var AGENT_EVENTS = [];
function _createElemByHTML(html) {
    var div = document.createElement("div");
    div.innerHTML = html;
    var els = div.children;
    return toArray(els);
}
function _isDOMList(selector) {
    if (!selector) {
        return false;
    }
    if (selector instanceof HTMLElement ||
        selector instanceof NodeList ||
        selector instanceof HTMLCollection) {
        return true;
    }
    return false;
}
function _querySelectorAll(selector) {
    var els = document.querySelectorAll(selector);
    return toArray(els);
}
function _styleArrTrim(style) {
    var styleArr = [];
    var resultArr = [];
    if (!Array.isArray(style)) {
        styleArr = style.split(";");
    }
    else {
        styleArr = style;
    }
    for (var _i = 0, styleArr_1 = styleArr; _i < styleArr_1.length; _i++) {
        var s = styleArr_1[_i];
        var arr = s.split(":").map(function (t) { return t.trim(); });
        if (arr.length === 2) {
            resultArr.push(arr.join(":"));
        }
    }
    return resultArr;
}
function _styleToString(style) {
    var res = "";
    for (var _i = 0, _a = Object.keys(style); _i < _a.length; _i++) {
        var k = _a[_i];
        var val = style[k];
        var newK = k.replace(/[A-Z]/g, function (substring) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            return "-" + substring.toLowerCase();
        });
        res += newK + ": " + val + ";";
    }
    return res;
}
function _styleToObject(style) {
    var res = {};
    var styleRes = style
        .split(";")
        .map(function (s) { return s.split(":"); })
        .filter(function (s) { return s.length === 2 && s[1]; })
        .map(function (s) { return s.map(function (ss) { return ss.trim(); }); });
    for (var _i = 0, styleRes_1 = styleRes; _i < styleRes_1.length; _i++) {
        var s = styleRes_1[_i];
        var k = s[0].replace(/-[a-z]/g, function (substring) {
            return substring[1].toLowerCase();
        });
        var v = s[1];
        res[k] = v;
    }
    return res;
}
/**
 * 1. 属性或参数中使用 ？：表示该属性或参数为可选项
 *
 * 2. 属性或参数中使用 ！：表示强制解析（告诉typescript编译器，这里一定有值），常用于vue-decorator中的@Prop
 *
 * 3. 变量后使用 ！：表示类型推断排除null、undefined
 */
var DomElement = /** @class */ (function () {
    function DomElement(selector) {
        this.length = 0;
        this.els = [];
        this.dataSource = new Map();
        if (!selector) {
            return;
        }
        if (selector instanceof DomElement) {
            // eslint-disable-next-line consistent-return
            return selector;
        }
        var selectorRes = [];
        var nodeType = selector instanceof Node ? selector.nodeType : -1;
        this.selector = selector;
        // 1: ELEMENT_NODE 9: DOCUMENT_NODE
        if (nodeType === 1 || nodeType === 9) {
            selectorRes = [selector];
        }
        else if (_isDOMList(selector)) {
            selectorRes = toArray(selector);
        }
        else if (selector instanceof Array) {
            selectorRes = selector;
        }
        else if (typeof selector === "string") {
            var _selector = selector.replace(/\n/gm, "");
            if (_selector.indexOf("<") === 0) {
                selectorRes = _createElemByHTML(_selector);
            }
            else {
                selectorRes = _querySelectorAll(_selector);
            }
        }
        var len = selectorRes.length;
        if (!len) {
            // eslint-disable-next-line consistent-return
            return this;
        }
        for (var i = 0; i < len; i += 1) {
            this.els[i] = selectorRes[i];
        }
        this.length = len;
    }
    Object.defineProperty(DomElement.prototype, "id", {
        get: function () {
            return this.els[0].id;
        },
        enumerable: false,
        configurable: true
    });
    DomElement.prototype.forEach = function (fn) {
        for (var i = 0; i < this.length; i += 1) {
            fn(this.els[i], i, this.els);
        }
        return this;
    };
    DomElement.prototype.clone = function (deep) {
        if (deep === void 0) { deep = false; }
        var cloneList = [];
        for (var _i = 0, _a = this.els; _i < _a.length; _i++) {
            var el = _a[_i];
            cloneList.push(el.cloneNode(!!deep));
        }
        return $(cloneList);
    };
    DomElement.prototype.get = function (index) {
        if (index === void 0) { index = 0; }
        var len = this.length;
        if (index >= len) {
            // eslint-disable-next-line no-param-reassign
            index %= len;
        }
        return $(this.els[index]);
    };
    DomElement.prototype.first = function () {
        return this.get();
    };
    DomElement.prototype.last = function () {
        return this.get(this.length - 1);
    };
    DomElement.prototype.on = function (type, selector, fn) {
        if (!type) {
            return this;
        }
        if (typeof selector === "function") {
            fn = selector;
            selector = "";
        }
        return this.forEach(function (el) {
            if (!selector) {
                el.addEventListener(type, fn);
                return;
            }
            var agentFn = function agentFn(e) {
                var target = e.target;
                // 如果元素被指定的选择器字符串选择，Element.matches()  方法返回true; 否则返回false。
                if (target.matches(selector)) {
                    ;
                    fn.call(target, e);
                }
            };
            el.addEventListener(type, agentFn);
            AGENT_EVENTS.push({
                el: el,
                selector: selector,
                fn: fn,
                agentFn: agentFn,
            });
        });
    };
    DomElement.prototype.off = function (type, selector, fn) {
        if (!type) {
            return this;
        }
        if (typeof selector === "function") {
            fn = selector;
            selector = "";
        }
        return this.forEach(function (el) {
            if (selector) {
                var idx = -1;
                for (var i = 0; i < AGENT_EVENTS.length; i += 1) {
                    var agent = AGENT_EVENTS[i];
                    if (agent.selector === selector &&
                        agent.fn === fn &&
                        agent.el === el) {
                        idx = i;
                        break;
                    }
                }
                if (idx !== -1) {
                    var agentFn = AGENT_EVENTS.splice(idx, 1)[0].agentFn;
                    el.removeEventListener(type, agentFn);
                }
            }
            else {
                el.removeEventListener(type, fn);
            }
        });
    };
    DomElement.prototype.attr = function (key, val) {
        if (val == null) {
            return this.els[0].getAttribute(key) || "";
        }
        return this.forEach(function (el) {
            el.setAttribute(key, val);
        });
    };
    DomElement.prototype.removeAttr = function (key) {
        this.forEach(function (el) {
            el.removeAttribute(key);
        });
    };
    DomElement.prototype.addClass = function (className) {
        if (!className) {
            return this;
        }
        return this.forEach(function (el) {
            if (el.className) {
                var res = el.className.split(/\s/);
                res = res.filter(function (c) { return !!c.trim(); });
                if (!res.includes(className)) {
                    res.push(className);
                    el.className = res.join(" ");
                }
            }
            else {
                el.className = className;
            }
        });
    };
    DomElement.prototype.removeClass = function (className) {
        if (!className) {
            return this;
        }
        return this.forEach(function (el) {
            if (!el.className) {
                return;
            }
            var res = el.className.split(/\s/);
            res = res.filter(function (c) {
                c = c.trim();
                return !(!c || c === className);
            });
            el.className = res.join(" ");
        });
    };
    DomElement.prototype.hasClass = function (className) {
        if (!className) {
            return false;
        }
        var el = this.els[0];
        if (!el.className) {
            return false;
        }
        var res = el.className.split(/\s/);
        return res.includes(className);
    };
    DomElement.prototype.css = function (style) {
        return this.forEach(function (el) {
            var elStyle = (el.getAttribute("style") || "").trim();
            var elStyleObj = _styleToObject(elStyle);
            if (Object.keys(elStyleObj).length) {
                el.setAttribute("style", _styleToString(__assign(__assign({}, elStyleObj), style)));
            }
            else {
                el.setAttribute("style", _styleToString(style));
            }
        });
    };
    DomElement.prototype.getBoundingClientRect = function () {
        return this.els[0].getBoundingClientRect();
    };
    DomElement.prototype.show = function (display) {
        return this.css({
            display: display || "block",
        });
    };
    DomElement.prototype.hide = function () {
        return this.css({
            display: "none",
        });
    };
    DomElement.prototype.children = function () {
        var el = this.els[0];
        if (!el) {
            return null;
        }
        return $(el.children);
    };
    DomElement.prototype.childNodes = function () {
        var el = this.els[0];
        if (!el) {
            return null;
        }
        return $(el.childNodes);
    };
    // useless
    DomElement.prototype.getNodeTop = function () {
        if (this.length < 1) {
            return this;
        }
        var $parent = this.parent();
        if (this.attr("contentEditable") === "true" ||
            $parent.attr("contentEditable") === "true") {
            return this;
        }
        $parent.prior = this;
        return $parent.getNodeTop();
    };
    // ???
    // replaceChildAll($children: DomElement): DomElement {
    //     const parent = this.getNode()
    //     const el = this.els[0]
    //     while (el.hasChildNodes()) {
    //         if (parent.firstChild) {
    //             el.removeChild(parent.firstChild)
    //         }
    //     }
    //     this.append($children)
    //     return this
    // }
    DomElement.prototype.append = function ($children) {
        return this.forEach(function (el) {
            $children.forEach(function (child) {
                el.appendChild(child);
            });
        });
    };
    DomElement.prototype.remove = function () {
        return this.forEach(function (el) {
            if (el.remove) {
                el.remove();
            }
            else {
                var parent_1 = el.parentElement;
                if (parent_1) {
                    parent_1.removeChild(el);
                }
            }
        });
    };
    DomElement.prototype.isContain = function ($child) {
        var el = this.els[0];
        var child = $child.els[0];
        return el.contains(child);
    };
    DomElement.prototype.getNodeName = function () {
        return this.els[0].nodeName;
    };
    DomElement.prototype.getNode = function (n) {
        if (n === void 0) { n = 0; }
        return this.els[n];
    };
    DomElement.prototype.find = function (selector) {
        return $(this.els[0].querySelector(selector));
    };
    DomElement.prototype.text = function (val) {
        if (!val) {
            return this.els[0].innerHTML.replace(/<[!>]>/g, "");
        }
        return this.forEach(function (el) {
            el.innerHTML = val;
        });
    };
    DomElement.prototype.html = function (val) {
        if (!val) {
            return this.els[0].innerHTML;
        }
        return this.forEach(function (el) {
            el.innerHTML = val;
        });
    };
    DomElement.prototype.val = function () {
        return this.els[0].value.trim();
    };
    DomElement.prototype.focus = function () {
        return this.forEach(function (el) {
            el.focus();
        });
    };
    DomElement.prototype.prev = function () {
        return $(this.els[0].previousElementSibling);
    };
    DomElement.prototype.next = function () {
        return $(this.els[0].nextElementSibling);
    };
    DomElement.prototype.parent = function () {
        return $(this.els[0].parentElement);
    };
    DomElement.prototype.parentUntil = function (selector, curEl) {
        var el = curEl || this.els[0];
        if (el.nodeName === "BODY") {
            return null;
        }
        var parent = el.parentElement;
        if (!parent) {
            return null;
        }
        if (parent.matches(selector)) {
            return $(parent);
        }
        return this.parentUntil(selector, parent);
    };
    DomElement.prototype.equal = function ($el) {
        if ($el instanceof DomElement) {
            return this.els[0] === $el.els[0];
        }
        if ($el instanceof HTMLElement) {
            return this.els[0] === $el;
        }
        return false;
    };
    DomElement.prototype.insertBefore = function (selector) {
        var $res = $(selector);
        var res = $res.els[0];
        if (!res) {
            return this;
        }
        return this.forEach(function (el) {
            var parent = el.parentNode;
            parent === null || parent === void 0 ? void 0 : parent.insertBefore(res.cloneNode(true), el);
        });
    };
    DomElement.prototype.insertAfter = function (selector) {
        var $res = $(selector);
        var res = $res.els[0];
        if (!res) {
            return this;
        }
        return this.forEach(function (el) {
            var parent = el.parentNode;
            var anchorNode = el && el.nextSibling;
            console.log('[anchorNode]', anchorNode, parent);
            if (anchorNode) {
                parent.insertBefore(res.cloneNode(true), anchorNode);
            }
            else {
                parent.appendChild(res.cloneNode(true));
            }
        });
    };
    // eslint-disable-next-line @typescript-eslint/no-shadow
    DomElement.prototype.data = function (key, val) {
        if (val != null) {
            this.dataSource.set(key, val);
        }
        return this.dataSource.get(key);
    };
    DomElement.prototype.getOffsetData = function () {
        var el = this.els[0];
        return {
            top: el.offsetTop,
            left: el.offsetLeft,
            width: el.offsetWidth,
            height: el.offsetHeight,
            parent: el.offsetParent,
        };
    };
    DomElement.prototype.scrollTop = function (top) {
        this.els[0].scrollTop = top;
    };
    return DomElement;
}());
export { DomElement };
function $() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    return new (DomElement.bind.apply(DomElement, __spreadArray([void 0], args)))();
}
export default $;
