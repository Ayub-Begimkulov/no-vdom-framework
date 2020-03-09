export interface IAttribute {
  name: string;
  value: string;
}

export interface INode {
  tag: string;
  attrs: IAttribute[];
  on?: IAttribute[];
  condition?: (state: any) => boolean;
  children?: Array<INode | string>;
}
