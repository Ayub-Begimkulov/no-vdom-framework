export interface IAttribute {
  name: string;
  value: string;
}

export interface INode {
  tag: string;
  attrs: IAttribute[];
  on?: IAttribute[];
  forLoop?: { alias: string; key: string };
  condition?: (state: any) => boolean;
  children?: Array<INode | string>;
}
