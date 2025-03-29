
// let token = await login("http://127.0.0.1:8000", "admin", "password");
export async function connect_to_typedb(address: string, username: string, password: string) : Promise<TypeDBHttpDriver> {
    let headers = {  "Content-Type": "application/json" };
    let body = { username: username, password: password };
    let response = await fetch(address + "/v1/signin", {
        method: "POST",
        body: JSON.stringify(body),
        headers: headers,
      });
    return new TypeDBHttpDriver(address, await response.text());
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


    async create_database(database: string) : Promise<boolean> {
        let response = await this.http_post("/v1/databases/" + database, undefined);
        if (response.ok) {
            return true;
        } else {
            alert("Error. Check log");
            console.log(response);
            return false;
        }
        
    }

    async query_read(database: string, query: string) : Promise<any> {
        return this.run_query(database, query, "read");
    }

    async query_write(database: string, query: string) : Promise<any> {
        return this.run_query(database, query, "write");
    }

    async query_schema(database: string, query: string) : Promise<any> {
        return this.run_query(database, query, "schema");
    }

    async run_query(database: string, query: string, transactionType: string) : Promise<any> {
        let response = await this.http_post("/v1/query", { query: query, databaseName: database, transactionType: transactionType });
        if (response.ok) {
            return JSON.parse(await response.text());
        } else {
            alert("Error. Check log");
            console.log(response);
            return response;
        }
    }

    async http_post(endpoint: string, body: any) {
        let headers = { "Authorization": "Bearer " + this.token,  "Content-Type": "application/json" };
        return await fetch(this.address + endpoint, {
            method: "POST",
            body: JSON.stringify(body),
            headers: headers,
          });
    }

    async http_get(endpoint: string) {
        let headers = { "Authorization": "Bearer " + this.token,  "Content-Type": "application/json" };
        return await fetch(this.address + endpoint, {
            method: "GET",
            headers: headers,
          });
    }
}
