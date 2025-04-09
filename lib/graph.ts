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
} from "./typedb/concept";
import {
    TypeDBRowData, TypeDBRowsResult,
    StructureEdge,
    StructureEdgTypeAny,
    StructureVertex,
    StructureVertexKind, StructureVertexLabel,
    StructureVertexVariable, StructureVertexUnavailable
} from "./typedb/answer"

//////////////////////////
// Logical TypeDB Graph //
//////////////////////////
export type VertexUnavailable = { kind: UnavailableKind, variable: String, answerIndex: number, vertex_map_key: string };
export type EdgeParameter = RoleType | VertexUnavailable | number | null;

export type LogicalVertexKind = ThingKind | TypeKind | ValueKind | UnavailableKind;
export type LogicalVertex = ConceptAny | VertexUnavailable;
export type LogicalVertexID = string;
export type StructureEdgeCoordinates = { branchIndex: number, constraintIndex: number };
export type LogicalEdge = { structureEdgeCoordinates: StructureEdgeCoordinates, type: LogicalEdgeType, from: LogicalVertexID, to: LogicalVertexID };
export type LogicalEdgeType = { kind: EdgeKind, param: EdgeParameter };

export type VertexMap = Map<LogicalVertexID, LogicalVertex>;

export type LogicalGraph = {
  vertices: VertexMap;
  answers: Array<Array<LogicalEdge>>;
}

///////////////////////////////////
// TypeDB server -> logical graph
///////////////////////////////////
export function constructGraphFromRowsResult(rows_result: TypeDBRowsResult) : LogicalGraph {
    return new LogicalGraphBuilder().build(rows_result);
}

class LogicalGraphBuilder {
    vertexMap: VertexMap;
    answers : Array<Array<LogicalEdge>> = [];
    constructor() {
        this.vertexMap = new Map();
        this.answers = [];
    }

    build(rows_result: TypeDBRowsResult) : LogicalGraph {
        rows_result.answers.forEach((row, answerIndex) => {
            let current_answer_edges: Array<LogicalEdge> = [];
            rows_result.queryStructure.branches.forEach((branch, branchIndex) => {
                if ( 0 == branchIndex || 0 != (row.provenance & (1 << branchIndex)) ){
                    current_answer_edges.push(...this.substitute_variables(branchIndex, answerIndex, branch.edges, row.data))
                }
            });
            this.answers.push(current_answer_edges);
        });
        return { vertices: this.vertexMap, answers: this.answers };
    }

    substitute_variables(branchIndex: number, answerIndex: number, branch: Array<StructureEdge>, data: TypeDBRowData) : Array<LogicalEdge> {
        return branch.map((structure_edge, constraintIndex) => {
            let coordinates = { branchIndex: branchIndex, constraintIndex: constraintIndex } ;
            let edge_type = this.extract_edge_type(structure_edge.type, answerIndex, data);
            let from = this.register_vertex(structure_edge.from, answerIndex, data);
            let to = this.register_vertex(structure_edge.to, answerIndex, data);
            return { structureEdgeCoordinates: coordinates, type: edge_type, from: from, to: to }
        });
    }

    register_vertex(structure_vertex: StructureVertex, answerIndex: number, data: TypeDBRowData): LogicalVertexID {
        let vertex = this.translate_vertex(structure_vertex, answerIndex, data);
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
                key = (value.valueType + ":" + value.value);
                break;
            }
            case "unavailable": {
                key = (vertex as VertexUnavailable).vertex_map_key;
                break;
            }

        }
        let vertex_id = key;
        this.vertexMap.set(vertex_id, vertex);
        return vertex_id;
    }

    translate_vertex(structure_vertex: StructureVertex, answerIndex: number, data: TypeDBRowData): LogicalVertex {
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
                let vertex = structure_vertex.value as StructureVertexUnavailable;
                let key = "unavailable[" + vertex.variable + "][" + answerIndex + "]";
                return { kind: "unavailable", vertex_map_key: key, answerIndex: answerIndex, variable: vertex.variable } as VertexUnavailable;
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

    extract_edge_type(structure_edge_type: StructureEdgTypeAny, answerIndex: number, data: TypeDBRowData): LogicalEdgeType {
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
                let role = this.translate_vertex(structure_edge_type.param as StructureVertex, answerIndex, data);
                return { kind: structure_edge_type.kind, param: role as RoleType | VertexUnavailable };
            }
            default: {
                console.log("Unsupported EdgeKind:"+ structure_edge_type)
                throw new Error("Unsupported EdgeKind:"+ structure_edge_type.kind);
            }
        }
    }
}
