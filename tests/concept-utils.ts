import {Attribute, Entity, ThingKind, TypeDBValue, TypeKind, ValueType} from "../lib/typedb/concept";

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
}