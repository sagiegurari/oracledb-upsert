## Objects

<dl>
<dt><a href="#UpsertExtension">UpsertExtension</a> : <code>object</code></dt>
<dd><p>The UPSERT extension.</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#AsyncCallback">AsyncCallback</a> : <code>function</code></dt>
<dd><p>Invoked when an async operation has finished.</p>
</dd>
</dl>

<a name="UpsertExtension"></a>
## UpsertExtension : <code>object</code>
The UPSERT extension.

**Kind**: global namespace  
**Access:** public  
**Author:** Sagie Gur-Ari  
<a name="UpsertExtension.upsert"></a>
### UpsertExtension.upsert(sqls, bindParams, [options], callback)
The UPSERT oracledb extension gets 3 SQL statements.<br>
It first queries the database of existing data, based on the output, it either runs INSERT or UPDATE SQL.<br>
If it runs the INSERT and it fails on unique constraint, it will also run the UPDATE.<br>
The output in the callback is the output of the INSERT/UPDATE operation.

**Kind**: static method of <code>[UpsertExtension](#UpsertExtension)</code>  
**Access:** public  

| Param | Type | Description |
| --- | --- | --- |
| sqls | <code>object</code> | Holds all required SQLs to support the UPSERT capability |
| sqls.query | <code>string</code> | The SELECT SQL statement |
| sqls.insert | <code>string</code> | The INSERT SQL statement |
| sqls.update | <code>string</code> | The UPDATE SQL statement |
| bindParams | <code>object</code> | The bind parameters used to specify the values for the columns, used by all execute operations |
| [options] | <code>object</code> | Used by all execute operations |
| callback | <code>[AsyncCallback](#AsyncCallback)</code> | Invoked once the UPSERT is done with either an error or the output |

**Example**  
```js
connection.upsert({
  query: 'SELECT ID FROM MY_DATA WHERE ID = :id',
  insert: 'INSERT INTO MY_DATA (ID, NAME) VALUES (:id, :name),
  update: 'UPDATE MY_DATA SET NAME = :name WHERE ID = :id''
}, {
  id: 110,
  name: 'new name'
}, {
  autoCommit: false
}, function onUpsert(error, results) {
  //continue flow...
});
```
<a name="AsyncCallback"></a>
## AsyncCallback : <code>function</code>
Invoked when an async operation has finished.

**Kind**: global typedef  

| Param | Type | Description |
| --- | --- | --- |
| [error] | <code>error</code> | Any possible error |
| [output] | <code>object</code> | The operation output |

