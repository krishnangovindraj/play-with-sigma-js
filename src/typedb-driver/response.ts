/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { Concept } from "./concept";
import { QueryStructure } from "./query-structure";

export type QueryType = "read" | "write" | "schema";

export interface ConceptRow {
    [varName: string]: Concept | undefined;
}

export interface ConceptRowAnswer {
    involvedBlocks: number[];
    data: ConceptRow;
}

export interface ConceptRowsQueryResponse {
    queryType: QueryType;
    answerType: "conceptRows";
    answers: ConceptRowAnswer[];
    comment: string | null;
    query: QueryStructure | null;
}
