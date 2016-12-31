## Classes

<dl>
<dt><a href="#Connection">Connection</a></dt>
<dd></dd>
</dl>

## Typedefs

<dl>
<dt><a href="#AsyncCallback">AsyncCallback</a> : <code>function</code></dt>
<dd><p>Invoked when an async operation has finished.</p>
</dd>
</dl>

<a name="Connection"></a>

## Connection
**Kind**: global class  
**Access:** public  
**Author:** Sagie Gur-Ari  

* [Connection](#Connection)
    * [new Connection()](#new_Connection_new)
    * [.upsert(sqls, bindParams, [options], [callback])](#Connection.upsert) ⇒ <code>Promise</code>

<a name="new_Connection_new"></a>

### new Connection()
This class holds all the extended capabilities added the oracledb connection.

<a name="Connection.upsert"></a>

### Connection.upsert(sqls, bindParams, [options], [callback]) ⇒ <code>Promise</code>
The UPSERT oracledb extension gets 3 SQL statements.<br>
It first queries the database for existing data, based on the output, it either runs INSERT or UPDATE SQL.<br>
If it runs the INSERT and it fails on unique constraint, it will also run the UPDATE.<br>
The output in the callback is the output of the INSERT/UPDATE operation.

**Kind**: static method of <code>[Connection](#Connection)</code>  
**Returns**: <code>Promise</code> - In case of no callback provided in input and promise is supported, this function will return a promise  
**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| sqls | <code>Object</code> | Holds all required SQLs to support the UPSERT capability |
| sqls.query | <code>String</code> | The SELECT SQL statement |
| sqls.insert | <code>String</code> | The INSERT SQL statement |
| sqls.update | <code>String</code> | The UPDATE SQL statement |
| bindParams | <code>Object</code> | The bind parameters used to specify the values for the columns, used by all execute operations (arrays not supported, only named bind params) |
| [options] | <code>Object</code> | Used by all execute operations |
| [callback] | <code>[AsyncCallback](#AsyncCallback)</code> | Invoked once the UPSERT is done with either an error or the output |

**Example**  
```js
connection.upsert({
  query: 'SELECT ID FROM MY_DATA WHERE ID = :id',
  insert: 'INSERT INTO MY_DATA (ID, NAME) VALUES (:id, :name)',
  update: 'UPDATE MY_DATA SET NAME = :name WHERE ID = :id'
}, {
  id: 110,
  name: 'new name'
}, {
  autoCommit: false
}, function onUpsert(error, results) {
  if (error) {
    //handle error...
  } else {
    console.log('rows affected: ', results.rowsAffected);

    //continue flow...
  }
});
```
<a name="AsyncCallback"></a>

## AsyncCallback : <code>function</code>
Invoked when an async operation has finished.

**Kind**: global typedef  

| Param | Type | Description |
| --- | --- | --- |
| [error] | <code>Error</code> | Any possible error |
| [output] | <code>Object</code> | The operation output |

