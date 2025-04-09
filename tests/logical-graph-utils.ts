// Vertex
import {
    LogicalEdge,
    LogicalEdgeType,
    LogicalGraph,
    LogicalVertex,
    LogicalVertexID,
    StructureEdgeCoordinates,
    VertexMap,
    VertexUnavailable
} from "../lib/graph";
import {
    Attribute,
    EdgeKind,
    ObjectAny,
    RoleType,
    ThingKind,
    TypeAny,
    TypeDBValue,
    TypeKind
} from "../lib/typedb/concept";

export class GraphHelper {
    static simpleEdge(kind: EdgeKind, branchIndex: number, constraintIndex: number, from: LogicalVertexID, to: LogicalVertexID): LogicalEdge {
        return {
            from: from,
            to: to,
            type: { kind: kind, param: null },
            structureEdgeCoordinates: { branchIndex: branchIndex,  constraintIndex: constraintIndex},
        };
    }

    static links(roleType: RoleType | null, branchIndex: number, constraintIndex: number, from: LogicalVertexID, to: LogicalVertexID): LogicalEdge {
        return {
            from: from,
            to: to,
            type: { kind: EdgeKind.links, param: roleType },
            structureEdgeCoordinates: { branchIndex: branchIndex,  constraintIndex: constraintIndex},
        };
    }

    static graphsAreEqual(first: LogicalGraph, second: LogicalGraph): boolean {
        return vertexMapsAreEqual(first.vertices, second.vertices)
            && answerSetsAreEqual(first.answers, second.answers);
    }
}

export function vertexMapsAreEqual(first: VertexMap, second: VertexMap) {
    if (first.size != second.size) {
        logCompared("VertexMap sizes are unequal", first, second);
        return false;
    }
    let mismatched_vertices = Array.from(first.keys())
        .filter(next => !verticesAreEqual(first.get(next)!, second.get(next)!));
    if (mismatched_vertices.length != 0) {
        console.log("Mismatched vertices: ");
        console.log(mismatched_vertices);
        return false;
    }
    return true;
}

export function verticesAreEqual(first: LogicalVertex, second: LogicalVertex): boolean {
    if (first.kind != second.kind) {
        return false;
    }
    switch (first.kind) {
        case TypeKind.entityType:
        case TypeKind.relationType:
        case TypeKind.roleType:
        case TypeKind.attributeType: {
            return (first as TypeAny).label == (second as TypeAny).label;
        }
        case ThingKind.entity:
        case ThingKind.relation: {
            let f = first as ObjectAny;
            let s = second as ObjectAny;
            return f.iid == s.iid && verticesAreEqual(f.type, s.type);
        }
        case ThingKind.attribute: {
            let f = first as Attribute;
            let s = second as Attribute;
            return f.iid == s.iid && f.value == s.value && f.valueType == s.valueType && verticesAreEqual(f.type, s.type);
        }
        case "value": {
            let f = first as TypeDBValue;
            let s = second as TypeDBValue;
            return f.value == s.value && f.valueType == s.valueType;
        }
        case "unavailable": {
            let f = first as VertexUnavailable;
            let s = second as VertexUnavailable;
            return f.variable == s.variable && f.answerIndex == s.answerIndex;
        }
        default: {
            throw new Error("Unsupported vertex type");
        }
    }
}

// Edges
export function answerSetsAreEqual(first: Array<Array<LogicalEdge>>, second: Array<Array<LogicalEdge>>) : boolean {
    if (first.length != second.length) {
        logCompared("Answer sets are unequal", first, second);
        return false;
    }
    let missingAnswers = first
        .filter(answer => !answerSetContainsAnswer(second, answer));
    if (missingAnswers.length != 0) {
        logCompared("Answer sets are unequal", first, second)
        console.log("Missing answers: ")
        console.log(missingAnswers);
        return false;
    }
    return true;
}

export function answerSetContainsAnswer(answerSet: Array<Array<LogicalEdge>>, answer: Array<LogicalEdge>): boolean {
    return answerSet.find(other => answersAreEqual(answer, other)) != undefined;
}

export function answersAreEqual(first: Array<LogicalEdge>, second: Array<LogicalEdge>): boolean {
    return first.map(edge => answerContainsEdge(second, edge)).reduce((prev, curr) => prev && curr, true);
}

export function answerContainsEdge(answer: Array<LogicalEdge>, edge: LogicalEdge): boolean {
    return answer.find(other => edgesAreEqual(edge, other)) != undefined;
}

export function edgesAreEqual(first: LogicalEdge, second: LogicalEdge): boolean {
    return vertexIdsAreEqual(first.from, second.from) && vertexIdsAreEqual(first.to, second.to)
        && edgeTypesAreEqual(first.type, second.type)
        && structureEdgeCoordinatesAreEqual(first.structureEdgeCoordinates, second.structureEdgeCoordinates);
}

export function vertexIdsAreEqual(first: LogicalVertexID, second: LogicalVertexID): boolean {
    return first == second;
}

export function edgeTypesAreEqual(first: LogicalEdgeType, second: LogicalEdgeType): boolean {
    if (first.kind != second.kind) {
        return false;
    }
    switch (first.kind) {
        case EdgeKind.links: {
            return verticesAreEqual(first.param as RoleType, second.param as RoleType);
        }
        case EdgeKind.isa:
        case EdgeKind.has:
        case EdgeKind.sub:
        case EdgeKind.owns:
        case EdgeKind.relates:
        case EdgeKind.plays:
        case EdgeKind.isaExact:
        case EdgeKind.subExact: {
            return true;
        }
    }
}

export function structureEdgeCoordinatesAreEqual(first: StructureEdgeCoordinates, second: StructureEdgeCoordinates) {
    return first.constraintIndex == second.constraintIndex && first.branchIndex == second.branchIndex;
}

function logCompared(message: string, first: any, second: any) {
    console.log(message);
    console.log("===");
    console.log(JSON.stringify(first, null, 2));
    console.log("---");
    console.log(JSON.stringify(second, null, 2));
    console.log("===");
}