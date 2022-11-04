import {readFileSync, writeFileSync} from "fs";
import squel from "squel";
import { format } from "sql-formatter";
import SqlString from 'sqlstring';

class SQLTabler
{
    private _table: string;
    private _fields: Record<string, string>;

    constructor (table: string)
    {
        this._table = table;
        this._fields = {};
    }

    table(name: string): this
    {
        this._table = name;
        return this;
    }

    field(name: string, modifiers: string): this
    {
        this._fields[name] = modifiers;
        return this;
    }

    fields(set: Record<string, string>): this
    {
        this._fields = set;
        return this;
    }

    toString(): string
    {
        let str = SqlString.format("CREATE TABLE ? (", [this._table]);
        for (const [columnName, modifiers] of Object.entries(this._fields))
        {
            str += SqlString.format(`\n\t? ${modifiers},`, [columnName]);
        }
        return `${str.slice(0, -1)}\n)`;
    }
}

class SQLBuilder
{
    private data: jsonToSql;

    constructor (data: jsonToSql)
    {
        this.data = data;
    }

    insertString(): string
    {
        if (!this.data.insert) return "";
        let str = "";
        
        for (const [tableName, sets] of Object.entries(this.data.insert))
        {
            for (let i = 0; i < sets.length; i++)
            {
                let query = squel.insert().into(tableName);
                for (const [columnName, value] of Object.entries(sets[i]))
                {
                    if (typeof value == "boolean") query.set(columnName, Number(value));
                    else query.set(columnName, value);
                }
                str += `${query};\n`;
            }
        }
        return str;
    }

    createString(): string
    {
        if (!this.data.create) return "";
        let str = "";
        
        for (const [tableName, set] of Object.entries(this.data.create))
        {
            let query = new SQLTabler(tableName);
            query.fields(set);
            str += `${query};\n`;
        }
        return str;
    }

    literalCodeString(): string
    {
        if (!this.data.sql) return "";
        let str = "";
        
        for (let i = 0; i < this.data.sql.length; i++)
        {
            str += `${this.data.sql[i]}\n`;
        }
        return str;
    }

    updateString(): string
    {
        if (!this.data.update) return "";
        let str = "";
        
        for (const [tableName, sets] of Object.entries(this.data.update))
        {
            for (let i = 0; i < sets.length; i++)
            {
                let query = squel.update().table(tableName);
                for (const [columnName, value] of Object.entries(sets[i].set))
                {
                    if (typeof value === "boolean") query.set(columnName, Number(value));
                    else query.set(columnName, value);
                }
                for (const [columnName, value] of Object.entries(sets[i].where))
                {
                    if (typeof value === "object" && value !== null)
                    {
                        if (typeof value[1] === "boolean") query.where(`${columnName} ${value[0]} ?`, Number(value));
                        else query.where(`${columnName} ${value[0]} ?`, value[1]);
                    }
                    else if (typeof value === "boolean") query.where(`${columnName} = ?`, Number(value));
                    else query.where(`${columnName} = ?`, value);
                }
                str += `${query};\n`;
            }
        }
        return str;
    }

    deleteString(): string
    {
        if (!this.data.delete) return "";
        let str = "";

        for (const [tableName, deletes] of Object.entries(this.data.delete))
        {
            if (deletes === "*") str += `${squel.delete().from(tableName)};\n`;
            else if (typeof deletes === "object" && deletes !== null)
            {
                for (let i = 0; i < deletes.length; i++)
                {
                    let query = squel.delete().from(tableName);
                    for (const [columnName, value] of Object.entries(deletes[i]))
                    {
                        if (typeof value === "object" && value !== null)
                        {
                            if (typeof value[1] === "boolean") query.where(`${columnName} ${value[0]} ?`, Number(value));
                            else query.where(`${columnName} ${value[0]} ?`, value[1]);
                        }
                        else if (typeof value === "boolean") query.where(`${columnName} = ?`, Number(value));
                        else query.where(`${columnName} = ?`, value);
                    }
                    str += `${query};\n`;
                }
            }
        }
        return str;
    }
    
    toString(): string
    {
        return format(
            `${this.createString()}\n${this.insertString()}\n${this.updateString()}\n` +
            `${this.deleteString()}\n${this.literalCodeString()}`
        );
    }
}

// Test
// console.log(`${new SQLBuilder(JSON.parse(readFileSync("./tests/test.json").toString()))}`);
console.log(`${new SQLBuilder({
    insert: {
        Modifiers: [
            {
                ModifierId: "WW_MODIFIER_TEST_POLICY",
                ModifierType: "MODTYPE_TESTING"
            }
        ]
    }
})}`)