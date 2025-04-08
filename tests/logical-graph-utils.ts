
// Vertex
import {
    LogicalEdge,
    LogicalEdgeType,
    LogicalVertex,
    LogicalVertexID, StructureEdgeCoordinates,
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
}


export function vertexMapsAreEqual(first: VertexMap, second: VertexMap) {
    return first.size == second.size &&
        Array.from(first.keys())
            .map(next => verticesAreEqual(first.get(next)!, second.get(next)!))
            .reduce((a,b) => a && b, true);
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
    return first.length == second.length &&
        first
            .map(answer => answerSetContainsAnswer(second, answer))
            .reduce((prev, current) => prev && current, true)
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
