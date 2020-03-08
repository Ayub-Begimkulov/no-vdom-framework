import { parseHTML } from './compiler/parse-html';
import { INode, IAttribute } from './types';

export const buildTree = (html: string) => {
  const AST = {} as INode;
  const stack: any[] = [];

  parseHTML(html, {
    start(
      tag: string,
      attrs: IAttribute[],
      unary: boolean,
      _start: number,
      _end: number
    ) {
      if (!stack[stack.length - 1]) {
        AST.tag = tag;
        AST.attrs = attrs;
        AST.children = [];
        stack.push(AST);
      } else {
        const parent = stack[stack.length - 1];
        !parent.children && (parent.children = []);
        const elem = {
          tag,
          attrs
        };
        parent.children.push(elem);
        !unary && stack.push(elem);
      }
    },
    end(_tag: string, _start: string, _end: string) {
      stack.pop();
    },
    chars(text: string, _start: string, _end: string) {
      const trimmedText = text.trim();
      if (trimmedText.length > 0) {
        const parent = stack[stack.length - 1] || AST;
        !parent.children && (parent.children = []);
        parent.children.push(trimmedText);
      }
    },
    warn: (message: string, { start, end }: Record<string, number>) =>
      console.error(`${html.substr(start, end - start)}\n\n${message}`)
  });

  console.log(AST);
  return AST;
};
