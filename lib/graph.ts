import Graph from "graphology";
import {TypeDBRowsResult, TypeDBQueryStructure } from "./common";

////////////////////////////
// Native TypeDB concepts //
////////////////////////////
export enum TypeKind {
  entityType = "entityType",
  relationType = "relationType",
  attributeType = "attributeType",
  roleType = "roleType",
}

export enum ThingKind {
  entity = "entity",
  relation = "relation",
  attribute = "attribute",
}
export type ValueKind = "value";
export type UnavailableKind = "unavailable";

export enum ValueType {
  integer = "integer",
  string = "string",
  // todo
}


export enum EdgeKind {
  has = "has",
  links = "links",
}


export type ObjectTypeVertex = {
  // iid: string,
  kind: TypeKind.entityType | TypeKind.relationType;
  label: string,
}

export type RoleTypeVertex = {
  kind: TypeKind.roleType;
  label: string,
}

export type AttributeTypeVertex = {
  // iid: string,
  label: string,
  kind: TypeKind.attributeType,
  value_type: ValueType,
}

export type TypeVertex = ObjectTypeVertex | RoleTypeVertex | AttributeTypeVertex;

export type ObjectVertex = {
  kind: ThingKind.entity | ThingKind.relation,
  iid: string,
  type: ObjectTypeVertex,
}

export type AttributeVertex = {
  kind: ThingKind.attribute,
  iid: string,
  type: AttributeTypeVertex,
  value: any,
}

export type ValueVertex = {
  kind: ValueKind,
  value: any,
  value_type: string,
}

export type VertexAny = TypeVertex | ObjectVertex | AttributeVertex | ValueVertex;


//////////////////////////
// Logical TypeDB Graph //
//////////////////////////
export type VertexUnavailable = { kind: UnavailableKind, iid: string };
export type EdgeParameter = TypeVertex | number | null;

export type LogicalVertex = VertexAny | VertexUnavailable;
export type LogicalEdge = { type: LogicalEdgeType, from: LogicalVertex, to: LogicalVertex };
export type LogicalEdgeType = { kind: EdgeKind, param: EdgeParameter };

export type VertexMap = { [id: string]: LogicalVertex };

export type LogicalGraph = {
  vertices: Array<VertexMap>;
  // edges: Array<{ kind: string, edge: { from: VertexAny, to: VertexAny, role: TypeVertex| null }}>;
  edges: Array<Array<LogicalEdge>>;
}


//////////////////////////////
// TypeDB -> Graphology
/////////////////////////////

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
  put_has(graph: Graph, answer_index:number, constraint_index: number, owner: ObjectVertex, attribute: AttributeVertex): void;
  put_links(graph: Graph, answer_index:number, constraint_index: number, relation: ObjectVertex, player: ObjectVertex, role: TypeVertex): void;
}
  
export function buildGraphFromTypeDB(logicalGraph: LogicalGraph , builder: ITypeDBToGraphology) : Graph {
var graph = new Graph();
// TODO: See the getGraph function for now
return graph;
}
