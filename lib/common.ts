import { VertexAny, TypeVertex, RoleTypeVertex, LogicalGraph, LogicalEdge, LogicalVertex, LogicalVertexID, ValueVertex, VertexMap, VertexUnavailable, UnavailableKind, EdgeKind, LogicalEdgeType } from "./graph";

// For common data-structures that convert between what the server gives us and what we need
export type TypeDBRowsResult = {
    queryType: string,
    answers: Array<TypeDBRow>,
    queryStructure: TypeDBQueryStructure,
    answerType: string,
}


// Answers:
type TypeDBRow = { data: TypeDBRowData, provenance: number }
type TypeDBRowData = { [id: string] : VertexAny };

/////////////////////
// Query structure //
/////////////////////
export type TypeDBQueryStructure = { branches: Array<{ edges: Array<StructureEdge> }> };

type StructureEdge = { 
    type: StructureEdgTypeAny,
    to: StructureVertexAny,
    from: StructureVertexAny,
};
type StructureEdgTypeAny = { kind: EdgeKind, param: StructureVertexAny | null };

// Vertex
type StructureVertexAny  = {
    kind: StructureVertexKind,
    value: StructureVertexVariable | StructureVertexUnavailable | StructureVertexLabel | StructureVertexValue
}
type StructureVertexVariable = { variable: string };
type StructureVertexLabel = TypeVertex;
type StructureVertexValue = ValueVertex; // { value_type: TypeDBValueType, value: any };
type StructureVertexUnavailable = null;

enum StructureVertexKind {
    variable = "variable",
    label = "label",
    value = "value",
    unavailable = "unavailableVariable",
}

///////////////////
// Concrete Edge
///////////////////
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

    register_vertex(structure_vertex: StructureVertexAny, data: TypeDBRowData): LogicalVertexID {
        let vertex = this.register_vertex_impl(structure_vertex, data);
        var key = null;
        if (vertex.iid != undefined) {
            key = vertex.iid;
        } else if (vertex.label != undefined) {
            key = vertex.label;
        } else if (vertex.value_type != undefined && vertex.value != undefined) {
            key = vertex.value_type + ":" + vertex.value;
        }
        let vertex_id = key;
        this.all_vertices.set(vertex_id, vertex);
        return vertex_id;
    }

    register_vertex_impl(structure_vertex: StructureVertexAny, data: TypeDBRowData): LogicalVertex {
        switch (structure_vertex.kind) {
            case StructureVertexKind.variable: {
                return data[(structure_vertex.value as StructureVertexVariable).variable] as VertexAny;
            } 
            case StructureVertexKind.label:{
                return structure_vertex.value as TypeVertex;
            }
            case StructureVertexKind.value:{
                return structure_vertex.value as ValueVertex;
            }
            case StructureVertexKind.unavailable: {
                nextUnavailable += 1;
                return { kind: "unavailable", iid: "unavailable_" + nextUnavailable  } as VertexUnavailable;
            }
        }
    }

    extract_edge_type(structure_edge_type: StructureEdgTypeAny, data: TypeDBRowData): LogicalEdgeType {
        switch (structure_edge_type.kind) {
            case EdgeKind.has: {
                // assert(structure_edge_type == null);
                return { kind: structure_edge_type.kind, param: null };
            }
            case EdgeKind.links: {
                let role = this.register_vertex(structure_edge_type.param as StructureVertexAny, data);
                return { kind: structure_edge_type.kind, param: role as RoleTypeVertex };
            }
        }
    }
}