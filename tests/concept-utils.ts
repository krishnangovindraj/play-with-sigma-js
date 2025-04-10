import {Attribute, Entity, RoleType, ThingKind, TypeDBValue, TypeKind, ValueType} from "../lib/typedb/concept";
import {LogicalVertex, SpecialVertexKind} from "../lib/graph.js";
import {unavailable_key} from "../lib/studio/converter.js";

export class ConceptHelper {
    static valueString(value: string): TypeDBValue {
        return { kind: "value", value: value, valueType: ValueType.string};
    }
    static valueInteger(value: number): TypeDBValue {
        return { kind: "value", value: value, valueType: ValueType.integer};
    }

    static attribute(iid: string, label: string, value: TypeDBValue): Attribute {
        return {
            kind: ThingKind.attribute, iid: iid, value: value.value, valueType: value.valueType, type: {
                kind: TypeKind.attributeType, label: label, value_type: value.valueType
            }
        };
    }

    static entity(iid: string, label: string): Entity {
        return {
            kind: ThingKind.entity, iid: iid, type: {
                kind: TypeKind.entityType, label: label,
            }
        };
    }

    static relation(iid: string, label: string): Entity {
        return {
            kind: ThingKind.relation, iid: iid, type: {
                kind: TypeKind.relationType, label: label,
            }
        };
    }

    static role(label: string): RoleType {
        return {
            kind: TypeKind.roleType, label: label,
        };
    }

    static getVertexKey(vertex: LogicalVertex, answerIndex: number) : string {
        // Warning: Depends on the converter implementation
        switch (vertex.kind) {
            case TypeKind.entityType:
            case TypeKind.relationType:
            case TypeKind.roleType:
            case TypeKind.attributeType: {
                return vertex.label;
            }
            case ThingKind.entity:
            case ThingKind.relation: {
                return vertex.iid;
            }
            case ThingKind.attribute: {
                return vertex.iid;
            }
            case SpecialVertexKind.unavailable: {
                return unavailable_key(vertex);
            }
            case SpecialVertexKind.func: {
                return vertex.repr + "["+ answerIndex + "]";
            }
            case SpecialVertexKind.expr: {
                return vertex.repr + "["+ answerIndex + "]";
            }
            case "value": {
                return vertex.valueType + ":" + vertex.value;
            }
            default: {
                throw new Error("test verification function getVertexKey not implemented for :" + vertex)
            }
        }
    }
}