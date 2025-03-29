import Graph from "graphology";

//////////////////////////
// TypeDB -> Graphology //
//////////////////////////
export type TypeVertex = {
  iid: string,
  label: string,
}

export type ObjectVertex = {
  iid: string,
  type: TypeVertex,
}

export type AttributeVertex = {
  iid: string,
  type: TypeVertex,
  value: any,
}

export type ValueVertex = {
  value: any,
}

export type VertexAny = TypeVertex | ObjectVertex | AttributeVertex | ValueVertex;

export enum Edge {
  Has,
  Links,
}

export type EdgeParameter = TypeVertex | number;


/**
 * You will majorly need:
 *  graph.addNode(id, attributes)
 *  graph.addNode(from, to,  attributes)
 * See: https://www.sigmajs.org/docs/advanced/data/ for attributes
 */
export interface ITypeDBToGraphology {
  // TODO: Functional vertices & edges like expressions, comparisons & function calls

  // Vertices
  put_attribute(graph: Graph, answer_index:number, vertex: AttributeVertex): void;
  put_entity(graph: Graph, answer_index:number, vertex: ObjectVertex): void;
  put_relation(graph: Graph, answer_index:number, vertex: ObjectVertex): void;
  
  // Edges
  put_has(graph: Graph,  answer_index:number, owner: ObjectVertex, attribute: AttributeVertex): void;
  put_links(graph: Graph,  answer_index:number, relation: ObjectVertex, player: ObjectVertex, role: TypeVertex): void;
}


export interface TypeDBResult {
    vertices: Array<VertexAny>,
    edges: Array<Array<any>>,  
}
  
export function buildGraphFromTypeDB(result: TypeDBResult , builder: ITypeDBToGraphology) : Graph {
var graph = new Graph();
// TODO: See the getGraph function for now
return graph;
}

  