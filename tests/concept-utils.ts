import {Attribute, Entity, ThingKind, TypeDBValue, TypeKind, ValueType} from "../lib/typedb/concept";
import {LogicalVertex} from "../lib/graph.js";
import {unavailable_key} from "../lib/studio/converter.js";

export class ConceptHelper {
    static valueString(value: string): TypeDBValue {
        return { kind: "value", value: value, valueType: ValueType.string};
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

    static getVertexKey(vertex: LogicalVertex) : string {
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
            case "unavailable": {
                return unavailable_key(vertex);
            }
            case "value":
            default: {
                throw new Error("test verification function getVertexKey not implemented for :" + vertex.kind)
            }
        }
    }
}