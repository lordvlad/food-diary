export function h (name, attributes) {
  const rest = []
  const children = []
  let length = arguments.length

  while (length-- > 2) rest.push(arguments[length])

  while (rest.length) {
    const node = rest.pop()
    if (node && node.pop) {
      for (length = node.length; length--;) {
        rest.push(node[length])
      }
    } else if (node != null && node !== true && node !== false) {
      children.push(node)
    }
  }

  return typeof name === 'function'
    ? name(attributes || {}, children)
    : {
      nodeName: name,
      attributes: attributes || {},
      children: children,
      key: attributes && attributes.key
    }
}

export function app (state, actions, view, container) {
  const map = [].map
  let rootElement = (container && container.children[0]) || null
  let oldNode = rootElement && recycleElement(rootElement)
  const lifecycle = []
  let skipRender
  let isRecycling = true
  let globalState = clone(state)
  const wiredActions = wireStateToActions([], globalState, clone(actions))

  scheduleRender()

  return wiredActions

  function recycleElement (element) {
    return {
      nodeName: element.nodeName.toLowerCase(),
      attributes: {},
      children: map.call(element.childNodes, function (element) {
        return element.nodeType === 3 // Node.TEXT_NODE
          ? element.nodeValue
          : recycleElement(element)
      })
    }
  }

  function resolveNode (node) {
    return typeof node === 'function'
      ? resolveNode(node(globalState, wiredActions))
      : node != null
        ? node
        : ''
  }

  function render () {
    skipRender = !skipRender

    const node = resolveNode(view)

    if (container && !skipRender) {
      rootElement = patch(container, rootElement, oldNode, (oldNode = node))
    }

    isRecycling = false

    while (lifecycle.length) lifecycle.pop()()
  }

  function scheduleRender () {
    if (!skipRender) {
      skipRender = true
      setTimeout(render)
    }
  }

  function clone (target, source) {
    const out = {}

    for (let i in target) out[i] = target[i]
    for (let i in source) out[i] = source[i]

    return out
  }

  function setPartialState (path, value, source) {
    const target = {}
    if (path.length) {
      target[path[0]] =
        path.length > 1
          ? setPartialState(path.slice(1), value, source[path[0]])
          : value
      return clone(source, target)
    }
    return value
  }

  function getPartialState (path, source) {
    let i = 0
    while (i < path.length) {
      source = source[path[i++]]
    }
    return source
  }

  function wireStateToActions (path, state, actions) {
    for (let key in actions) {
      typeof actions[key] === 'function'
        ? (function (key, action) {
          actions[key] = function (data) {
            let result = action(data)

            if (typeof result === 'function') {
              result = result(getPartialState(path, globalState), actions)
            }

            if (
              result &&
                result !== (state = getPartialState(path, globalState)) &&
                !result.then // !isPromise
            ) {
              scheduleRender(
                (globalState = setPartialState(
                  path,
                  clone(state, result),
                  globalState
                ))
              )
            }

            return result
          }
        })(key, actions[key])
        : wireStateToActions(
          path.concat(key),
          (state[key] = clone(state[key])),
          (actions[key] = clone(actions[key]))
        )
    }

    return actions
  }

  function getKey (node) {
    return node ? node.key : null
  }

  function eventListener (event) {
    return event.currentTarget.events[event.type](event)
  }

  function updateAttribute (element, name, value, oldValue, isSvg) {
    if (name === 'key') {
    } else if (name === 'style') {
      if (typeof value === 'string') {
        element.style.cssText = value
      } else {
        if (typeof oldValue === 'string') oldValue = element.style.cssText = ''
        for (let i in clone(oldValue, value)) {
          const style = value == null || value[i] == null ? '' : value[i]
          if (i[0] === '-') {
            element.style.setProperty(i, style)
          } else {
            element.style[i] = style
          }
        }
      }
    } else {
      if (name[0] === 'o' && name[1] === 'n') {
        name = name.slice(2)

        if (element.events) {
          if (!oldValue) oldValue = element.events[name]
        } else {
          element.events = {}
        }

        element.events[name] = value

        if (value) {
          if (!oldValue) {
            element.addEventListener(name, eventListener)
          }
        } else {
          element.removeEventListener(name, eventListener)
        }
      } else if (
        name in element &&
        name !== 'list' &&
        name !== 'type' &&
        name !== 'draggable' &&
        name !== 'spellcheck' &&
        name !== 'translate' &&
        !isSvg
      ) {
        element[name] = value == null ? '' : value
      } else if (value != null && value !== false) {
        element.setAttribute(name, value)
      }

      if (value == null || value === false) {
        element.removeAttribute(name)
      }
    }
  }

  function createElement (node, isSvg) {
    const element =
      typeof node === 'string' || typeof node === 'number'
        ? document.createTextNode(node)
        : ((isSvg = isSvg || node.nodeName === 'svg'))
          ? document.createElementNS(
            'http://www.w3.org/2000/svg',
            node.nodeName
          )
          : document.createElement(node.nodeName)

    const attributes = node.attributes
    if (attributes) {
      if (attributes.oncreate) {
        lifecycle.push(function () {
          attributes.oncreate(element)
        })
      }

      for (let i = 0; i < node.children.length; i++) {
        element.appendChild(
          createElement(
            (node.children[i] = resolveNode(node.children[i])),
            isSvg
          )
        )
      }

      for (let name in attributes) {
        updateAttribute(element, name, attributes[name], null, isSvg)
      }
    }

    return element
  }

  function updateElement (element, oldAttributes, attributes, isSvg) {
    for (let name in clone(oldAttributes, attributes)) {
      if (
        attributes[name] !==
        (name === 'value' || name === 'checked'
          ? element[name]
          : oldAttributes[name])
      ) {
        updateAttribute(
          element,
          name,
          attributes[name],
          oldAttributes[name],
          isSvg
        )
      }
    }

    const cb = isRecycling ? attributes.oncreate : attributes.onupdate
    if (cb) {
      lifecycle.push(function () {
        cb(element, oldAttributes)
      })
    }
  }

  function removeChildren (element, node) {
    const attributes = node.attributes
    if (attributes) {
      for (let i = 0; i < node.children.length; i++) {
        removeChildren(element.childNodes[i], node.children[i])
      }

      if (attributes.ondestroy) {
        attributes.ondestroy(element)
      }
    }
    return element
  }

  function removeElement (parent, element, node) {
    function done () {
      parent.removeChild(removeChildren(element, node))
    }

    const cb = node.attributes && node.attributes.onremove
    if (cb) {
      cb(element, done)
    } else {
      done()
    }
  }

  function patch (parent, element, oldNode, node, isSvg) {
    if (node === oldNode) {
    } else if (oldNode == null || oldNode.nodeName !== node.nodeName) {
      const newElement = createElement(node, isSvg)
      parent.insertBefore(newElement, element)

      if (oldNode != null) {
        removeElement(parent, element, oldNode)
      }

      element = newElement
    } else if (oldNode.nodeName == null) {
      element.nodeValue = node
    } else {
      updateElement(
        element,
        oldNode.attributes,
        node.attributes,
        (isSvg = isSvg || node.nodeName === 'svg')
      )

      const oldKeyed = {}
      const newKeyed = {}
      const oldElements = []
      const oldChildren = oldNode.children
      const children = node.children

      for (let i = 0; i < oldChildren.length; i++) {
        oldElements[i] = element.childNodes[i]

        const oldKey = getKey(oldChildren[i])
        if (oldKey != null) {
          oldKeyed[oldKey] = [oldElements[i], oldChildren[i]]
        }
      }

      let i = 0
      let k = 0

      while (k < children.length) {
        const oldKey = getKey(oldChildren[i])
        const newKey = getKey((children[k] = resolveNode(children[k])))

        if (newKeyed[oldKey]) {
          i++
          continue
        }

        if (newKey != null && newKey === getKey(oldChildren[i + 1])) {
          if (oldKey == null) {
            removeElement(element, oldElements[i], oldChildren[i])
          }
          i++
          continue
        }

        if (newKey == null || isRecycling) {
          if (oldKey == null) {
            patch(element, oldElements[i], oldChildren[i], children[k], isSvg)
            k++
          }
          i++
        } else {
          var keyedNode = oldKeyed[newKey] || []

          if (oldKey === newKey) {
            patch(element, keyedNode[0], keyedNode[1], children[k], isSvg)
            i++
          } else if (keyedNode[0]) {
            patch(
              element,
              element.insertBefore(keyedNode[0], oldElements[i]),
              keyedNode[1],
              children[k],
              isSvg
            )
          } else {
            patch(element, oldElements[i], null, children[k], isSvg)
          }

          newKeyed[newKey] = children[k]
          k++
        }
      }

      while (i < oldChildren.length) {
        if (getKey(oldChildren[i]) == null) {
          removeElement(element, oldElements[i], oldChildren[i])
        }
        i++
      }

      for (let i in oldKeyed) {
        if (!newKeyed[i]) {
          removeElement(element, oldKeyed[i][0], oldKeyed[i][1])
        }
      }
    }
    return element
  }
}
