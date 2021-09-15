/**
 * @description DOM 操作
 * @komorebi
 */

/* eslint-disable @typescript-eslint/ban-types */

function toArray<T>(likeArr: Iterable<T> | ArrayLike<T>): T[] {
    return Array.from(likeArr)
}

type Listener = (e: Event) => void
type EventItem = {
    el: HTMLElement
    selector: string
    fn: Listener
    agentFn: Listener
}
type OffsetDataType = {
    top: number
    left: number
    width: number
    height: number
    parent: Element | null
}

const AGENT_EVENTS: EventItem[] = []
export type Style = {
    [key in keyof CSSStyleDeclaration]?: CSSStyleDeclaration[key]
}

function _createElemByHTML(html: string): HTMLElement[] {
    const div = document.createElement("div")
    div.innerHTML = html
    const els = div.children

    return toArray(els) as HTMLElement[]
}
function _isDOMList<T extends HTMLCollection | NodeList>(
    selector: unknown
): selector is T {
    if (!selector) {
        return false
    }
    if (
        selector instanceof HTMLElement ||
        selector instanceof NodeList ||
        selector instanceof HTMLCollection
    ) {
        return true
    }

    return false
}
function _querySelectorAll(selector: string): HTMLElement[] {
    const els = document.querySelectorAll(selector)

    return toArray(els) as HTMLElement[]
}
function _styleArrTrim(style: string | string[]): string[] {
    let styleArr: string[] = []
    const resultArr: string[] = []

    if (!Array.isArray(style)) {
        styleArr = style.split(";")
    } else {
        styleArr = style
    }

    for (const s of styleArr) {
        const arr = s.split(":").map((t) => t.trim())
        if (arr.length === 2) {
            resultArr.push(arr.join(":"))
        }
    }

    return resultArr
}
function _styleToString(style: Style): string {
    let res = ""

    for (let k of Object.keys(style)) {
        const val = style[k as any]
        const newK = k.replace(/[A-Z]/g, (substring: string, ...args) => {
            return `-${substring.toLowerCase()}`
        })
        res += `${newK}: ${val};`
    }

    return res
}
function _styleToObject(style: string): Style {
    const res: Style = {}
    const styleRes = style
        .split(";")
        .map((s) => s.split(":"))
        .filter((s) => s.length === 2 && s[1])
        .map((s) => s.map((ss) => ss.trim()))

    for (const s of styleRes) {
        const k = s[0].replace(/-[a-z]/g, (substring: string) =>
            substring[1].toLowerCase()
        )
        const v = s[1]
        res[k as any] = v
    }

    return res
}

export type DomElementSelector =
    | string
    | DomElement
    | Node
    | NodeList
    | ChildNode
    | ChildNode[]
    | Element
    | HTMLElement
    | HTMLElement[]
    | HTMLCollection
    | EventTarget
    | null
    | undefined
/**
 * 1. 属性或参数中使用 ？：表示该属性或参数为可选项
 *
 * 2. 属性或参数中使用 ！：表示强制解析（告诉typescript编译器，这里一定有值），常用于vue-decorator中的@Prop
 *
 * 3. 变量后使用 ！：表示类型推断排除null、undefined
 */
export class DomElement<T extends DomElementSelector = DomElementSelector> {
    selector!: T

    length = 0

    els: HTMLElement[] = []

    dataSource: Map<string, any> = new Map()

    prior?: DomElement

    constructor(selector: T) {
        if (!selector) {
            return
        }

        if (selector instanceof DomElement) {
            // eslint-disable-next-line consistent-return
            return selector as DomElement<T>
        }

        let selectorRes: HTMLElement[] = []
        const nodeType = selector instanceof Node ? selector.nodeType : -1
        this.selector = selector
        // 1: ELEMENT_NODE 9: DOCUMENT_NODE

        if (nodeType === 1 || nodeType === 9) {
            selectorRes = [selector] as HTMLElement[]
        } else if (_isDOMList(selector)) {
            selectorRes = toArray(selector as HTMLCollection) as HTMLElement[]
        } else if (selector instanceof Array) {
            selectorRes = selector as HTMLElement[]
        } else if (typeof selector === "string") {
            const _selector = selector.replace(/\n/gm, "")

            if (_selector.indexOf("<") === 0) {
                selectorRes = _createElemByHTML(_selector)
            } else {
                selectorRes = _querySelectorAll(_selector)
            }
        }

        const len = selectorRes.length

        if (!len) {
            // eslint-disable-next-line consistent-return
            return this
        }

        for (let i = 0; i < len; i += 1) {
            this.els[i] = selectorRes[i]
        }

        this.length = len
    }

    get id(): string {
        return this.els[0].id
    }

    forEach(
        fn: (
            el: HTMLElement,
            index?: number,
            els?: HTMLElement[]
        ) => boolean | unknown
    ): DomElement {
        for (let i = 0; i < this.length; i += 1) {
            fn(this.els[i], i, this.els)
        }
        return this
    }

    clone(deep = false): DomElement {
        const cloneList: HTMLElement[] = []

        for (const el of this.els) {
            cloneList.push(el.cloneNode(!!deep) as HTMLElement)
        }

        return $(cloneList)
    }

    get(index = 0): DomElement {
        const len = this.length

        if (index >= len) {
            // eslint-disable-next-line no-param-reassign
            index %= len
        }

        return $(this.els[index])
    }

    first(): DomElement {
        return this.get()
    }

    last(): DomElement {
        return this.get(this.length - 1)
    }

    on(type: string, fn: Function): DomElement
    on(type: string, selector: string, fn: Function): DomElement
    on(type: string, selector: string | Function, fn?: Function): DomElement {
        if (!type) {
            return this
        }

        if (typeof selector === "function") {
            fn = selector
            selector = ""
        }

        return this.forEach((el) => {
            if (!selector) {
                el.addEventListener(type, fn as Listener)
                return
            }

            const agentFn: Listener = function agentFn(e) {
                const target = e.target as HTMLElement
                // 如果元素被指定的选择器字符串选择，Element.matches()  方法返回true; 否则返回false。
                if (target.matches(selector as string)) {
                    ;(fn as Listener).call(target, e)
                }
            }

            el.addEventListener(type, agentFn)

            AGENT_EVENTS.push({
                el,
                selector: selector as string,
                fn: fn as Listener,
                agentFn,
            })
        })
    }

    off(type: string, fn: Function): DomElement
    off(type: string, selector: string, fn: Function): DomElement
    off(type: string, selector: string | Function, fn?: Function): DomElement {
        if (!type) {
            return this
        }

        if (typeof selector === "function") {
            fn = selector
            selector = ""
        }

        return this.forEach((el) => {
            if (selector) {
                let idx = -1

                for (let i = 0; i < AGENT_EVENTS.length; i += 1) {
                    const agent = AGENT_EVENTS[i]
                    if (
                        agent.selector === selector &&
                        agent.fn === fn &&
                        agent.el === el
                    ) {
                        idx = i
                        break
                    }
                }

                if (idx !== -1) {
                    const { agentFn } = AGENT_EVENTS.splice(idx, 1)[0]
                    el.removeEventListener(type, agentFn)
                }
            } else {
                el.removeEventListener(type, fn as Listener)
            }
        })
    }

    attr(key: string): string
    attr(key: string, val: string): DomElement
    attr(key: string, val?: string): DomElement | string {
        if (val == null) {
            return this.els[0].getAttribute(key) || ""
        }

        return this.forEach((el: HTMLElement) => {
            el.setAttribute(key, val)
        })
    }

    removeAttr(key: string): void {
        this.forEach((el) => {
            el.removeAttribute(key)
        })
    }

    addClass(className?: string): DomElement {
        if (!className) {
            return this
        }

        return this.forEach((el) => {
            if (el.className) {
                let res: string[] = el.className.split(/\s/)
                res = res.filter((c: string) => !!c.trim())

                if (!res.includes(className)) {
                    res.push(className)
                    el.className = res.join(" ")
                }
            } else {
                el.className = className
            }
        })
    }

    removeClass(className?: string): DomElement {
        if (!className) {
            return this
        }

        return this.forEach((el) => {
            if (!el.className) {
                return
            }

            let res: string[] = el.className.split(/\s/)
            res = res.filter((c: string) => {
                c = c.trim()

                return !(!c || c === className)
            })

            el.className = res.join(" ")
        })
    }

    hasClass(className?: string): boolean {
        if (!className) {
            return false
        }

        const el = this.els[0]
        if (!el.className) {
            return false
        }

        const res: string[] = el.className.split(/\s/)
        return res.includes(className)
    }

    css(style: Style): DomElement {
        return this.forEach((el) => {
            const elStyle = (el.getAttribute("style") || "").trim()
            const elStyleObj: Style = _styleToObject(elStyle)

            if (Object.keys(elStyleObj).length) {
                el.setAttribute(
                    "style",
                    _styleToString({
                        ...elStyleObj,
                        ...style,
                    })
                )
            } else {
                el.setAttribute("style", _styleToString(style))
            }
        })
    }

    getBoundingClientRect(): DOMRect {
        return this.els[0].getBoundingClientRect()
    }

    show(
        display?: "block" | "inline" | "inline-block" | "flex" | "inline-flex"
    ): DomElement {
        return this.css({
            display: display || "block",
        })
    }

    hide(): DomElement {
        return this.css({
            display: "none",
        })
    }

    children(): DomElement | null {
        const el = this.els[0]

        if (!el) {
            return null
        }

        return $(el.children)
    }

    childNodes(): DomElement | null {
        const el = this.els[0]

        if (!el) {
            return null
        }

        return $(el.childNodes)
    }

    // useless
    getNodeTop(): DomElement {
        if (this.length < 1) {
            return this
        }

        const $parent = this.parent()

        if (
            this.attr("contentEditable") === "true" ||
            $parent.attr("contentEditable") === "true"
        ) {
            return this
        }

        $parent.prior = this
        return $parent.getNodeTop()
    }

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

    append($children: DomElement): DomElement {
        return this.forEach((el) => {
            $children.forEach((child: HTMLElement) => {
                el.appendChild(child)
            })
        })
    }

    remove(): DomElement {
        return this.forEach((el) => {
            if (el.remove) {
                el.remove()
            } else {
                const parent = el.parentElement
                if (parent) {
                    parent.removeChild(el)
                }
            }
        })
    }

    isContain($child: DomElement): boolean {
        const el = this.els[0]
        const child = $child.els[0]

        return el.contains(child)
    }

    getNodeName(): string {
        return this.els[0].nodeName
    }

    getNode(n = 0): Node {
        return this.els[n]
    }

    find(selector: string): DomElement {
        return $(this.els[0].querySelector(selector))
    }

    text(): string
    text(val: string): DomElement
    text(val?: string): DomElement | string {
        if (!val) {
            return this.els[0].innerHTML.replace(/<[!>]>/g, "")
        }

        return this.forEach((el) => {
            el.innerHTML = val
        })
    }

    html(): string
    html(val: string): DomElement
    html(val?: string): DomElement | string {
        if (!val) {
            return this.els[0].innerHTML
        }

        return this.forEach((el) => {
            el.innerHTML = val
        })
    }

    val(): string {
        return (this.els[0] as any).value.trim()
    }

    focus(): DomElement {
        return this.forEach((el) => {
            el.focus()
        })
    }

    prev(): DomElement {
        return $(this.els[0].previousElementSibling)
    }

    next(): DomElement {
        return $(this.els[0].nextElementSibling)
    }

    parent(): DomElement {
        return $(this.els[0].parentElement)
    }

    parentUntil(selector: string, curEl?: HTMLElement): DomElement | null {
        const el = curEl || this.els[0]

        if (el.nodeName === "BODY") {
            return null
        }

        const parent = el.parentElement

        if (!parent) {
            return null
        }

        if (parent.matches(selector)) {
            return $(parent)
        }

        return this.parentUntil(selector, parent)
    }

    equal($el: DomElement | HTMLElement): boolean {
        if ($el instanceof DomElement) {
            return this.els[0] === $el.els[0]
        }

        if ($el instanceof HTMLElement) {
            return this.els[0] === $el
        }

        return false
    }

    insertBefore(selector: string | DomElement): DomElement {
        const $res = $(selector)
        const res = $res.els[0]

        if (!res) {
            return this
        }

        return this.forEach((el) => {
            const parent = el.parentNode as Node
            parent?.insertBefore(res.cloneNode(true), el)
        })
    }

    insertAfter(selector: string | DomElement): DomElement {
        const $res = $(selector)
        const res = $res.els[0]

        if (!res) {
            return this
        }

        return this.forEach((el) => {
            const parent = el.parentNode as Node
            const anchorNode = el && el.nextSibling
            console.log('[anchorNode]', anchorNode, parent)

            if (anchorNode) {
                parent.insertBefore(res.cloneNode(true), anchorNode)
            } else {
                parent.appendChild(res.cloneNode(true))
            }
        })
    }

    // eslint-disable-next-line @typescript-eslint/no-shadow
    data<T>(key: string, val?: T): T | undefined {
        if (val != null) {
            this.dataSource.set(key, val)
        }

        return this.dataSource.get(key)
    }

    getOffsetData(): OffsetDataType {
        const el = this.els[0]

        return {
            top: el.offsetTop,
            left: el.offsetLeft,
            width: el.offsetWidth,
            height: el.offsetHeight,
            parent: el.offsetParent,
        }
    }

    scrollTop(top: number): void {
        this.els[0].scrollTop = top
    }
}

function $(...args: ConstructorParameters<typeof DomElement>): DomElement {
    return new DomElement(...args)
}


export default $
