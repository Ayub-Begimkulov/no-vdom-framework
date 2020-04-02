import { buildTree } from './buildTree';
import { INode, IAttribute } from './types';

/* 
  TODO
  1) For Loop
*/

type Patch = (newVal: any, oldVal: any) => void;
let activeFunction: Patch | null = null;
const deps: Record<string, Set<Patch>> = Object.create(null);

const addDep = (key: string, value: Patch) =>
  (deps[key] || (deps[key] = new Set())).add(value);

const state: Record<string, any> = new Proxy(
  {
    text: 'hello world',
    items: [1, 2, 3]
  },
  {
    get(obj: typeof state, key: string) {
      activeFunction && addDep(key, activeFunction);
      return obj[key];
    },
    set(obj: typeof state, key: string, val: any) {
      let prev = obj[key];
      obj[key] = val;
      deps[key]?.forEach(patch => patch(val, prev));
      return true;
    }
  }
);

const tree = buildTree(
  `
  <div class="text">
    <div $if="!!state.text">{{ text }}</div>
    <input type="text" @input="onInput" />
    <p class="{{text}}">asdf</p>
    <button @click="onClick">Click</button>
    <ul>
      <li #for="item in items">{{ item }}</li>   
    </ul>
  </div>
`
);

const listeners: Record<string, EventListenerOrEventListenerObject> = {
  onInput: e => (state.text = (e.target as HTMLInputElement).value),
  onClick: _e =>
    (state.items = new Array(Math.floor(Math.random() * 10)).fill(1))
};

const renderNode = (node: INode | string, parent: HTMLElement) => {
  if (typeof node === 'string') {
    const key = node.match(/{{([^{}]*)}}/)?.[1].trim();
    const text = document.createTextNode(key ? state[key] : node);
    parent.appendChild(text);

    key && addDep(key, (val: string) => (text.nodeValue = val));

    return;
  }

  if (node.forLoop) {
    const key = node.forLoop.key;
    const arr = state[key];
    if (arr) {
      const test = {
        ...node,
        forLoop: undefined
      };

      arr.forEach(() => renderNode(test, parent));

      addDep(key, (newVal: any[], _oldVal: any[]) => {
        removeNodes(parent);
        newVal.forEach(() => renderNode(test, parent));
      });
    }
    return;
  }

  const el = document.createElement(node.tag);

  setAttrs(el, node.attrs);

  node.on?.forEach(({ name, value }) => {
    listeners[value] && el.addEventListener(name, listeners[value]);
  });

  node.children?.forEach(child => {
    renderNode(child, el);
  });

  const condition = node.condition;

  if (condition) {
    const comment = document.createComment('');
    activeFunction = () => {
      if (condition(state)) {
        if (el.parentNode !== parent) {
          parent.insertBefore(el, comment);
          parent.removeChild(comment);
        }
      } else if (el.parentNode === parent) {
        parent.insertBefore(comment, el);
        parent.removeChild(el);
      }
    };
    condition(state) ? parent.appendChild(el) : parent.appendChild(comment);
    activeFunction = null;
  } else {
    parent.appendChild(el);
  }
  return el;
};

const setAttrs = (el: HTMLElement, attrs: IAttribute[]) => {
  attrs.forEach(({ name, value }) => {
    let match, key;
    if ((match = value.match(/{{([^{}]*)}}/))) {
      key = match[1].trim();
    }

    key && addDep(key, (val: string) => el.setAttribute(name, val));
    el.setAttribute(name, key ? state[key] : value);
  });

  return el;
};

const root = document.getElementById('app')!;
tree.forEach(node => renderNode(node, root));

// const isDef = (val: any) => val != null;
const removeNodes = (parent: HTMLElement) => {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
};
