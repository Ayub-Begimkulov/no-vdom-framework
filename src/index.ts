/* 
  TODO
  1) Do an auto update system according to the state
  2) Add ability to pass functions to the template
  3) Add ability to manipulate state from template
  4) Add ability to use string as a template 

*/

interface INode {
  tag: string;
  attrs: Record<string, string>;
  condition?: () => boolean;
  on?: Record<string, EventListenerOrEventListenerObject>;
  children?: Array<INode | string>;
}

let activeFunction: Function | null = null;
const deps: Record<string, Set<Function>> = Object.create(null);
const removeListenersSet = new Set<Function>();

const state: Record<string, string> = new Proxy(
  {
    text: ''
  },
  {
    get(obj: typeof state, key: string) {
      if (activeFunction) {
        (deps[key] || (deps[key] = new Set())).add(activeFunction);
      }
      return obj[key];
    },
    set(obj: typeof state, key: string, val: any) {
      obj[key] = val;
      deps[key]?.forEach(patch => patch(val));
      return true;
    }
  }
);

const tree: INode = {
  tag: 'div',
  attrs: {
    class: 'test'
  },
  children: [
    {
      tag: 'div',
      attrs: {},
      condition: () => !!state.text,
      children: ['{{text}}']
    },
    {
      tag: 'input',
      attrs: {
        type: 'text'
      },
      on: {
        input: e => (state.text = (e.target as HTMLInputElement).value)
      }
    },
    {
      tag: 'p',
      attrs: {
        class: '{{ text }}'
      },
      children: ['fasfkjsa']
    }
  ]
};

function renderTree(tree: INode, parent: HTMLElement) {
  const el = document.createElement(tree.tag);

  Object.entries(tree.attrs).forEach(([key, value]) => {
    let match, stateKey;
    if ((match = value.match(/{{([^{}]*)}}/))) {
      stateKey = match[1].trim();
    }

    if (stateKey) {
      (deps[stateKey] || (deps[stateKey] = new Set())).add((val: string) =>
        el.setAttribute(key, val)
      );
    }

    el.setAttribute(key, stateKey ? state[stateKey] : value);
  });

  Object.entries(tree.on || {}).forEach(([key, value]) => {
    el.addEventListener(key, value);
    removeListenersSet.add(() => el.removeEventListener(key, value));
  });

  tree.children?.forEach(child => {
    if (typeof child === 'string') {
      const key = child.match(/{{([^{}]*)}}/)?.[1].trim();
      const text = document.createTextNode(key ? state[key] : child);
      el.appendChild(text);

      if (key) {
        (deps[key] || (deps[key] = new Set())).add(
          (val: string) => (text.nodeValue = val)
        );
      }
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
}

renderTree(tree, document.getElementById('app')!);
