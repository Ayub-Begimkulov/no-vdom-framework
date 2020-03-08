import { buildTree } from './buildTree';
import { INode } from './types';

/* 
  TODO
  1) Do an auto update system according to the state
  2) Add ability to pass functions to the template
  3) Add ability to manipulate state from template
  4) Add ability to use string as a template 

*/

const tree = buildTree(`
  <div class="text">
    <div>{{ text }}</div>
    <input type="text" @input="onInput" />
    <p class="{{text}}">asdf</p>
  </div>
`);

let activeFunction: Function | null = null;
const deps: Record<string, Set<Function>> = Object.create(null);

const addDep = (key: string, value: Function) =>
  (deps[key] || (deps[key] = new Set())).add(value);

const state: Record<string, string> = new Proxy(
  {
    text: 'hello world'
  },
  {
    get(obj: typeof state, key: string) {
      activeFunction && addDep(key, activeFunction);
      return obj[key];
    },
    set(obj: typeof state, key: string, val: any) {
      obj[key] = val;
      deps[key]?.forEach(patch => patch(val));
      return true;
    }
  }
);

const listeners: Record<string, EventListenerOrEventListenerObject> = {
  onInput: (e: Event) => (state.text = (e.target as HTMLInputElement).value)
};

const renderTree = (tree: INode, parent: HTMLElement) => {
  const el = document.createElement(tree.tag);

  tree.attrs.forEach(({ name, value }) => {
    let match, key;
    if ((match = value.match(/{{([^{}]*)}}/))) {
      key = match[1].trim();
    }

    if (name.charAt(0) === '@') {
      listeners[value] && el.addEventListener(name.substr(1), listeners[value]);
    } else {
      key && addDep(key, (val: string) => el.setAttribute(name, val));
      el.setAttribute(name, key ? state[key] : value);
    }
  });

  tree.children?.forEach(child => {
    if (typeof child === 'string') {
      const key = child.match(/{{([^{}]*)}}/)?.[1].trim();
      const text = document.createTextNode(key ? state[key] : child);
      el.appendChild(text);

      key && addDep(key, (val: string) => (text.nodeValue = val));
    } else {
      renderTree(child, el);
    }
  });

  if (tree.condition) {
    const comment = document.createComment('');
    activeFunction = () => {
      // @ts-ignore
      if (tree.condition()) {
        if (el.parentNode !== parent) {
          parent.insertBefore(el, comment);
          parent.removeChild(comment);
        }
      } else if (el.parentNode === parent) {
        parent.insertBefore(comment, el);
        parent.removeChild(el);
      }
    };
    tree.condition() ? parent.appendChild(el) : parent.appendChild(comment);
    activeFunction = null;
  } else {
    parent.appendChild(el);
  }
  return parent;
};

renderTree(tree, document.getElementById('app')!);
