mysql-object
====

a very lightweight mysql orm library

不同于sequelize等orm，mysql-object无需手动维护一份对象类型。my-orm着重于把update中的普通object，转成sql语句
## usage
```
npm install mysql-object --save
```

### js
```
let {Mysql} = require('../mmysql-object')

  let mysql = Mysql.create(JSON.parse(process.env.MYSQL))
  let r = await mysql.query(`select * from test_book`)

```

### typescript
```
import {Mysql, Pager} from 'mysql-object'

  let mysql = Mysql.create(JSON.parse(process.env.MYSQL))
  let r = await mysql.find('test_book')
```

## run test

- run data.sql to setup your data
- MYSQL='{"host":"xxx", "user":"xxx", "password":"xxx","database":"xxx"}' yarn test

## detail usage

```
import { Mysql, Pager } from './index'

(async function main() {
  let mysql: Mysql = Mysql.create(JSON.parse(process.env.MYSQL))
  let r: any = null
  // 返回数组
  r = await mysql.query(`select * from test_book`)
  // 返回1行
  r = await mysql.queryOne(`select * from test_book`)
  // 返回1个值
  r = await mysql.queryValue(`select count(*) from test_book`)
  // 返回1列，结果为id数组
  r = await mysql.queryColumn(`select id from test_book`)

  r = await mysql.find('test_book') // 获取test_book表的所有内容
  r = await mysql.find('test_book', {
    attributes: ['id', 'name'], // 生成 select id, name
    where: {
      origin_price: 40.00, // 生成 origin_price=40.00
      description: [92.00, 36.80], // 生成 description in (92.00, 36.80)
      $like: {
        name: 'Gossie', // 生成 goods_title like '%Gossie%'
      }
    },
    pager: new Pager({
      order: '-id',  // 生成 order by id desc
      offset: 20,
      limit: 10, // 生成 limit 20, 10
    }),
  })

  // 删除id=26的记录
  r = await mysql.deleteById('test_book', 26)
  // 插入1条数据
  r = await mysql.insert(`test_book`, { id: 26, name: '123..' })
  // 重复插入，但是catch异常
  r = await mysql.insert(`test_book`, { id: 26, name: '123..' }).catch(f => f)
  // 生成 insert into ... on duplicate ignore
  r = await mysql.insert(`test_book`, { id: 26, name: '123..' }, { ignore: true })

  r = await mysql.insert(`test_book`,
    [{ id: 26, name: '123..' }, { id: 1, name: '企鹅兰登经典分级读物' }], // 支持批量插入
    { updates: ['name'] }, // 生成 insert into ... on duplicate update ... 如果updates:[]，则更新对象中的所有属性
  )

  // 更新匹配的属性，要求传入的对象给出id字段
  // 如果没有给出id字段，则需要给出除id外的其他所有的非NULL字段
  r = await mysql.update(`test_book`, { id: 26, name: '123..' })

  r = await mysql.updateReturn(`test_book`, { id: 26, name: '123..' }) // 更新并返回该对象

  r = await mysql.deleteWhere('test_book', { id: 26 })

  // 表join的高级用法
  r = await mysql.find('test_book_author', {
    attributes: ['id', 'name'],
    // 包含test_book，test_book为一个对象，通过book_author表里的book_id能够找到对应的book
    include: ['test_book'],
  })
  r = await mysql.find(`test_book`, {
    where: { id: 1, 'test_book_author.name': '兰登' },
    // 包含test_book_image，为一个数组，通过test_book_image里面的book_id，能够找到一个book的所有image
    include: ['test_book_image', {
      // include中的表，只选取部分属性
      table: 'test_book_author',
      attributes: ['name', 'description'],
    }],
  })
  process.exit(0)
})()

```
- more detail please see test.ts
