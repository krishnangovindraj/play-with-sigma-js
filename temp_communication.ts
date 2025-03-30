
export type TypeDBResult<OK> = {
    ok: OK | undefined,
    err: string | undefined
}

// let token = await login("http://127.0.0.1:8000", "admin", "password");
export async function connectToTypeDB(address: string, username: string, password: string) : Promise<TypeDBResult<TypeDBHttpDriver>> {
    let headers = {  "Content-Type": "application/json" };
    let body = { username: username, password: password };
    let response = await fetch(address + "/v1/signin", {
        method: "POST",
        body: JSON.stringify(body),
        headers: headers,
      });
      if (response.ok) {
        return { ok: new TypeDBHttpDriver(address, await response.text()) } as TypeDBResult<TypeDBHttpDriver>;
      } else {
        return { err: await response.text() } as TypeDBResult<TypeDBHttpDriver>;
      }
}

export type TypeDBQueryResponse = {
    // todo
};

export class TypeDBHttpDriver {
    address: string;
    token : string;

    constructor(address: string, token: string) {
        this.address = address;
        this.token = token;
    }


    async createDatabase(database: string) : Promise<boolean> {
        let response = await this.httpPost("/v1/databases/" + database, undefined);
        if (response.ok) {
            return true;
        } else {
            alert("Error. Check log");
            console.log(response);
            return false;
        }
        
    }

    async queryRead(database: string, query: string) : Promise<any> {
        return this.runQuery(database, query, "read");
    }

    async queryWrite(database: string, query: string) : Promise<any> {
        return this.runQuery(database, query, "write");
    }

    async querySchema(database: string, query: string) : Promise<any> {
        return this.runQuery(database, query, "write");
    }

    async runQuery(database: string, query: string, transactionType: string) : Promise<any> {
        let response = await this.httpPost("/v1/query", { query: query, databaseName: database, transactionType: transactionType });
        if (response.ok) {
            return JSON.parse(await response.text());
        } else {
            alert("Error. Check log");
            console.log(response);
            return response;
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
}
