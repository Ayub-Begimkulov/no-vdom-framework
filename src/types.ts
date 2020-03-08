export interface IAttribute {
  name: string;
  value: string;
}
export interface INode {
  tag: string;
  attrs: IAttribute[];
  condition?: () => boolean;
  children?: Array<INode | string>;
}
