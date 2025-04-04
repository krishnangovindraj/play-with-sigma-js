import {TypeDBRowData, TypeDBRowsResult} from "./common";
import {
    Attribute,
    ConceptAny,
    EdgeKind,
    ObjectAny,
    RoleType,
    ThingKind,
    TypeAny,
    TypeDBValue,
    TypeKind,
    UnavailableKind,
    ValueKind
} from "./concept";
import {
    StructureEdge,
    StructureEdgTypeAny,
    StructureVertex,
    StructureVertexKind, StructureVertexLabel,
    StructureVertexVariable
} from "./querystructure.js"

//////////////////////////
// Logical TypeDB Graph //
//////////////////////////
export type VertexUnavailable = { kind: UnavailableKind, iid: string };
export type EdgeParameter = RoleType | VertexUnavailable | number | null;

export type LogicalVertexKind = ThingKind | TypeKind | ValueKind | UnavailableKind;
export type LogicalVertex = ConceptAny | VertexUnavailable;
export type LogicalVertexID = string;
export type LogicalEdge = { type: LogicalEdgeType, from: LogicalVertexID, to: LogicalVertexID };
export type LogicalEdgeType = { kind: EdgeKind, param: EdgeParameter };

export type VertexMap = Map<LogicalVertexID, LogicalVertex>;

export type LogicalGraph = {
  vertices: VertexMap;
  // edges: Array<{ kind: string, edge: { from: ConceptAny, to: ConceptAny, role: TypeAny| null }}>;
  edges: Array<Array<LogicalEdge>>;
}

///////////////////////////////////
// TypeDB server -> logical graph
///////////////////////////////////
export function constructGraphFromRowsResult(rows_result: TypeDBRowsResult) : LogicalGraph {
    return new LogicalGraphBuilder().build(rows_result);
}

var nextUnavailable = 0;
class LogicalGraphBuilder {
    all_vertices: VertexMap;
    all_edges : Array<Array<LogicalEdge>> = [];
    constructor() {
        this.all_vertices = new Map();
        this.all_edges = [];
    }

    build(rows_result: TypeDBRowsResult) : LogicalGraph {
        rows_result.answers.forEach(row => {
            for (let i = 0; i < rows_result.queryStructure.branches.length; i++) {
                if ( 0 ==i || 0 != (row.provenance & (1 << i)) ){
                    let edges = rows_result.queryStructure.branches[i].edges;
                    this.all_edges.push(this.substitute_variables(edges, row.data))
                }
            }
        });
        return { vertices: this.all_vertices, edges: this.all_edges };
    }

    substitute_variables(branch: Array<StructureEdge>, data: TypeDBRowData) : Array<LogicalEdge> {
        return branch.map(structure_edge => {
            let edge_type = this.extract_edge_type(structure_edge.type, data);
            let from = this.register_vertex(structure_edge.from, data);
            let to = this.register_vertex(structure_edge.to, data);
            return { type: edge_type, from: from, to: to }
        });
    }

    register_vertex(structure_vertex: StructureVertex, data: TypeDBRowData): LogicalVertexID {
        let vertex = this.translate_vertex(structure_vertex, data);
        let key = null;
        switch (vertex.kind) {
            case ThingKind.attribute:{
                let attribute = vertex as Attribute;
                key = attribute.type.label + ":" + attribute.value;
                break;
            }
            case ThingKind.entity:
            case ThingKind.relation: {
                key = (vertex as ObjectAny).iid;
                break;
            }
            case TypeKind.attributeType:
            case TypeKind.entityType:
            case TypeKind.relationType:
            case TypeKind.roleType: {
                key = (vertex as TypeAny).label;
                break;
            }
            case "value": {
                let value = vertex as TypeDBValue;
                key = (value.value_type + ":" + value.value);
                break;
            }
            case "unavailable": {
                key = "unavailable#" + (vertex as VertexUnavailable).iid;
                break;
            }

        }
        let vertex_id = key;
        this.all_vertices.set(vertex_id, vertex);
        return vertex_id;
    }

    translate_vertex(structure_vertex: StructureVertex, data: TypeDBRowData): LogicalVertex {
        switch (structure_vertex.kind) {
            case StructureVertexKind.variable: {
                return data[(structure_vertex.value as StructureVertexVariable).variable] as ConceptAny;
            } 
            case StructureVertexKind.label:{
                let vertex= structure_vertex.value as StructureVertexLabel;
                let type_kind = this.translate_thing_kind_to_type_kind(vertex.kind);
                return { kind: type_kind, label: vertex.label } as TypeAny;
            }
            case StructureVertexKind.value:{
                return structure_vertex.value as TypeDBValue;
            }
            case StructureVertexKind.unavailable: {
                nextUnavailable += 1;
                return { kind: "unavailable", iid: "unavailable_" + nextUnavailable  } as VertexUnavailable;
            }
        }
    }

    translate_thing_kind_to_type_kind(thing_kind: ThingKind | "relation:role"): TypeKind {
        switch (thing_kind) {
            case ThingKind.relation: return TypeKind.relationType;
            case ThingKind.entity: return TypeKind.entityType;
            case ThingKind.attribute: return TypeKind.attributeType;
            case "relation:role": return TypeKind.roleType;
            default: {
                throw new Error("Unrecognised: " + thing_kind);
            }
        }
    }

    extract_edge_type(structure_edge_type: StructureEdgTypeAny, data: TypeDBRowData): LogicalEdgeType {
        switch (structure_edge_type.kind) {
            case EdgeKind.isa:
            case EdgeKind.has:
            case EdgeKind.sub:
            case EdgeKind.owns:
            case EdgeKind.relates:
            case EdgeKind.plays:
            case EdgeKind.isaExact:
            case EdgeKind.subExact:
            {
                return { kind: structure_edge_type.kind, param: null };
            }
            case EdgeKind.links: {
                let role = this.translate_vertex(structure_edge_type.param as StructureVertex, data);
                return { kind: structure_edge_type.kind, param: role as RoleType | VertexUnavailable };
            }
            default: {
                console.log("Unsupported EdgeKind:"+ structure_edge_type)
                throw new Error("Unsupported EdgeKind:"+ structure_edge_type.kind);
            }
        }
    }
}
