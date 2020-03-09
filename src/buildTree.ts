import { parseHTML } from './compiler/parse-html';
import { INode, IAttribute } from './types';

export const buildTree = <T extends Record<string, any> = Record<string, any>>(
  html: string,
  state: T
) => {
  const AST: INode[] = [];
  const stack: any[] = [];

  parseHTML(html, {
    start(
      tag: string,
      attrs: IAttribute[],
      unary: boolean,
      _start: number,
      _end: number
    ) {
      const on: IAttribute[] = [];
      let condition: Function | null = null;
      const elAttrs: IAttribute[] = [];
      const forInRegex = /\s*([a-zA-Z_$][0-9a-zA-Z_$]*)\s+in\s+([a-zA-Z_$][0-9a-zA-Z_$]*)\s*/;
      attrs.forEach(attr => {
        switch (attr.name.charAt(0)) {
          case '@':
            on.push({ name: attr.name.substr(1), value: attr.value });
            break;
          case '$':
            condition = new Function('state', 'return ' + attr.value);
            break;
          case '#':
            const match = attr.value.match(forInRegex);
            if (match) {
              const alias = match[1].trim();
              const arrKey = match[2].trim();

              console.log(alias, state[arrKey]);
            }
            break;
          default:
            elAttrs.push(attr);
        }
      });

      const parent = stack[stack.length - 1];
      const childrenArray = parent
        ? parent.children || (parent.children = [])
        : AST;
      const node: INode = {
        tag,
        attrs: elAttrs,
        children: []
      };
      condition && (node.condition = condition);
      on.length > 0 && (node.on = on);
      childrenArray.push(node);
      !unary && stack.push(node);
    },
    end(_tag: string, _start: string, _end: string) {
      stack.pop();
    },
    chars(text: string, _start: string, _end: string) {
      const trimmedText = text.trim();
      if (trimmedText.length > 0) {
        const parent = stack[stack.length - 1];
        const childrenArray = parent
          ? parent.children || (parent.children = [])
          : AST;
        childrenArray.push(trimmedText);
      }
    },
    warn: (message: string, { start, end }: Record<string, number>) =>
      console.error(`${html.substr(start, end - start)}\n\n${message}`)
  });

  console.log(AST);
  return AST;
};
