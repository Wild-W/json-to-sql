type jsonToSql = {

    /**
     * Update existing tables.
     */
    update?: Record<string, {set: columns, where: where}[]>,

    /**
     * Insert into existing tables.
     */
    insert?: Record<string, columns[]>,

    /**
     * Create new tables.
     */
    create?: Record<string, Record<string, string>>,

    /**
     * Delete rows from tables.
     */
    delete?: Record<string, "*"|where[]>,

    /**
     * Literal strings of SQL code, will be placed top level.
      */
    sql?: string[],
}

type columns = Record<string, string|boolean|number|null>
type where = columns|[string, string|boolean|number|null]