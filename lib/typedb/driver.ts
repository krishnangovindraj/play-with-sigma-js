import {TypeDBAnswerAny, TypeDBQueryType} from "./answer";

export type TypeDBResult<OK> = {
    ok: OK | undefined,
    err: string | undefined
}

export async function connectToTypeDB(address: string, username: string, password: string) : Promise<TypeDBResult<TypeDBHttpDriver>> {
    let headers = {  "Content-Type": "application/json" };
    let body = { username: username, password: password };
    let response = await fetch(address + "/v1/signin", {
        method: "POST",
        body: JSON.stringify(body),
        headers: headers,
    });
    if (response.ok) {
        return { ok: new TypeDBHttpDriver(address, (await response.json()).token ) } as TypeDBResult<TypeDBHttpDriver>;
    } else {
        return { err: await response.text() } as TypeDBResult<TypeDBHttpDriver>;
    }
}

export class TypeDBHttpDriver {
    address: string;
    token : string;

    constructor(address: string, token: string) {
        this.address = address;
        this.token = token;
    }

    async createDatabase(database: string) : Promise<TypeDBResult<boolean>> {
        let response = await this.httpPost("/v1/databases/" + database, undefined);
        if (response.ok) {
            return {ok : true} as TypeDBResult<boolean>;
        } else {
            return { err: await response.text() } as TypeDBResult<boolean>;
        }
    }

    async deleteDatabase(database: string) : Promise<TypeDBResult<boolean>> {
        let response = await this.httpDelete("/v1/databases/" + database, undefined);
        if (response.ok) {
            return {ok : true} as TypeDBResult<boolean>;
        } else {
            return { err: await response.text() } as TypeDBResult<boolean>;
        }
    }

    async runQuery(database: string, query: string, transactionType: TypeDBQueryType) : Promise<TypeDBResult<TypeDBAnswerAny>> {
        let response = await this.httpPost("/v1/query", { query: query, databaseName: database, transactionType: transactionType });
        if (response.ok) {
            return { ok: JSON.parse(await response.text()) } as TypeDBResult<any>;
        } else {
            return { err: await response.text() } as TypeDBResult<any>;
        }
    }

    async httpPost(endpoint: string, body: any) {
        let headers = { "Authorization": "Bearer " + this.token,  "Content-Type": "application/json" };
        return await fetch(this.address + endpoint, {
            method: "POST",
            body: JSON.stringify(body),
            headers: headers,
        });
    }

    async httpGet(endpoint: string) {
        let headers = { "Authorization": "Bearer " + this.token,  "Content-Type": "application/json" };
        return await fetch(this.address + endpoint, {
            method: "GET",
            headers: headers,
        });
    }

    async httpDelete(endpoint: string) {
        let headers = {"Authorization": "Bearer " + this.token, "Content-Type": "application/json"};
        return await fetch(this.address + endpoint, {
            method: "DELETE",
            headers: headers,
        });
    }
}
