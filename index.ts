import * as _ from 'underscore'
require('date-format-lite')
Date['masks']['default'] = 'YYYY-MM-DD hh:mm:ss'


let createTime = 'create_time'
let updateTime = 'update_time'

declare global {
  interface Date {
    format(fmt?: string): string
  }
}

export function printable(body: any) {
  if (body === undefined) return null
  if (Buffer.isBuffer(body)) return `buffer ... ${body.length} bytes: ` + body.slice(0, 50)
  let s = typeof body === 'string' ? body : JSON.stringify(body)
  if (s && s.length > 5 * 1024) return ` ... ${s.length} bytes: ` + s.slice(0, 50)
  return s
}

export interface PagerOptions {
  offset?: string | number
  limit?: string | number
  order?: string
  sql?: string
}

export class Pager {
  offset?: string | number
  limit?: string | number
  order?: string
  sql: string
  sqlOrder: string
  sqlLimit: string
  constructor(pager: PagerOptions = {}) {
    let parseOrder = order => {
      if (order.startsWith('+')) {
        return `${order.slice(1)} asc`
      }
      if (order.startsWith('-')) {
        return `${order.slice(1)} desc`
      }
      return `${order} desc`
    }
    let sqlOrder = pager.order ? 'order by ' + parseOrder(pager.order) : ''
    let sqlLimit = pager.limit || pager.offset ? `limit ${pager.offset || 0}, ${pager.limit || 10}` : ''
    return { sqlOrder, sqlLimit, sql: `${sqlOrder} ${sqlLimit}`, ...pager }
  }
}

export interface IncludeType {
  table: string
  attributes?: string[]
}
export interface FindOptions {
  attributes?: string[] | string
  where?: object
  include?: (string | IncludeType)[]
  pager?: Pager
}

export interface InsertOptions {
  ignore?: boolean
  updates?: string[] // 默认[], 更新所有匹配的字段
  meta?: any
}
// 内部的mysql，保存了内部的mysql连接
export class MysqlConn {
  my: any
  dbstr: string | object
  constructor(dbconf: string | object, poolEnabled) {
    this.dbstr = dbconf
    let my = require('mysql2')
    this.my = poolEnabled ? my.createPool(dbconf) : my.createConnection(dbconf)
    console.log('connecting ', dbconf)
    if (!poolEnabled) return
    // pool类型的连接，需要单独弄一个心跳连接，不断检查连接情况，避免长时间空闲导致链接断开
    let heartbeatMy = my.createConnection(dbconf)
    const mysqlHeartbeat = () => {
      heartbeatMy.query('select 1', (err) => {
        if (err) throw err
        console.log('heart beat to mysql')
      })
    }
    mysqlHeartbeat()
    setInterval(mysqlHeartbeat, 2 * 60 * 1000)
  }
  static newPoolConn(dbstr): MysqlConn {
    return new MysqlConn(dbstr, true)
  }
  static newAloneConn(dbstr): MysqlConn {
    return new MysqlConn(dbstr, false)
  }
  cloneAloneConn(): MysqlConn {
    return new MysqlConn(this.dbstr, false)
  }
}

export class Mysql {
  conn: MysqlConn
  static single: Mysql = null
  constructor(conn: MysqlConn) {
    this.conn = conn
  }
  // 单例模式的mysql，内部使用pool
  static create(dbstr) {
    if (!Mysql.single) {
      Mysql.single = new Mysql(MysqlConn.newPoolConn(dbstr))
    }
    return Mysql.single
  }
  // 创建事务型连接，用完记得释放
  static async createTransactionMysql(dbstr) {
    let trans = new TransactionMysql(MysqlConn.newAloneConn(dbstr))
    return await trans.beginTransaction()
  }
  // 根据当前连接的配置创建一个单独的支持事务的连接，用完记得释放
  async cloneTransactionMysql(): Promise<TransactionMysql> {
    let con = this.conn.cloneAloneConn()
    let trans = new TransactionMysql(con)
    return await trans.beginTransaction()
  }
  close = () => {
    this.conn.my.end()
  }
  escape = v => this.conn.my.escape(v)
  escapeId = id => this.conn.my.escapeId(id)
  toWhere = where => {
    let my = require('mysql2')
    let conds = []
    for (let k in where) {
      let v = where[k]
      let ek = my.escapeId(k)
      if (k === '$like') { // 搜索用的多个条件
        for (let likeKey in v) {
          if (!v[likeKey]) continue
          let lv = my.escape(v[likeKey].toString()).slice(1, -1)
          if (!lv) continue
          if (lv.startsWith('^')) { // 以^开头，要求前半部分精确匹配
            lv = "'" + lv.slice(1)
          } else {
            lv = "'%" + lv
          }
          if (lv.endsWith('$')) { // 以$结尾，要求后半部分精确匹配
            lv = lv.slice(0, -1) + "'"
          } else {
            lv = lv + "%'"
          }
          conds.push(`${my.escapeId(likeKey)} like ${lv}`)
        }
      } else if (v === null) {
        conds.push(`${ek} is null`)
      } else if (_.isArray(v)) {
        if (!v.length) {
          v.push(null)
        }
        conds.push(`${ek} in (${v.map(e => my.escape(e)).join(',')})`)
      } else {
        conds.push(`${ek}=${my.escape(v)}`)
      }
    }
    return conds.join(' and ') || ' 1=1 '
  }
  async query(sql: string, ...args): Promise<any[]> {
    return this.execute(sql, ...args)
  }
  queryOne = async (sql: string, ...args): Promise<any> => {
    return this.query(sql, ...args).then(r => r[0])
  }
  queryColumn = async (sql: string, ...args): Promise<any> => {
    return this.query(sql, ...args).then(rs => rs.map(r => _.values(r)[0]))
  }
  queryValue = async (sql: string, ...args): Promise<any> => {
    return this.queryColumn(sql, ...args).then(col => col[0])
  }
  find = async (table: string, options?: FindOptions): Promise<any[]> => {
    let opts: any = {
      attributes: ['*'],
      pager: new Pager(),
      ...options,
    }
    if (!opts.include) { // 没有表join，直接返回
      if (typeof opts.attributes !== 'string') {
        opts.attributes = opts.attributes.join(',')
      }
      return await this.execute(`select ${opts.attributes} from ${table} where ${this.toWhere(opts.where)} ${opts.pager.sql}`)
    }

    let { include, attributes } = opts
    // 将include里面简写的table转成完整的table, atrributes的形式
    include = include.map(e => ({ table: e.table || e, attributes: e.attributes || ['*'] }))

    let joinInfos = [] // 查询外键表，生成sql的 left join 部分
    for (let joined of include) {
      joinInfos.push(await this.getJoinInfo(table, joined.table))
    }
    let joins = joinInfos.filter(f => f).map(f => `left join ${f.dest} on ${f.join}`).join(' ')

    // 每个join表指定的属性
    let tableSelects = include.map(t => t.attributes.map(a => `${t.table}.${a}`).join(',')).join(',')

    // 如果where中的条件没有指定表名称，那么加上默认表的名称
    let where = _.pairs(opts.where).map(a => [a[0].indexOf('.') >= 0 ? a[0] : table + '.' + a[0], a[1]])
    if (typeof attributes !== 'string') {
      attributes = attributes.map(a => `${table}.${a}`).join(',')
    }
    let sql = `select ${attributes}, ${tableSelects} from ${table} ${joins} where ${this.toWhere(_.object(where))} ${opts.pager.sql}`
    let rows = await this.execute({ sql, nestTables: true })
    let grouped = _.groupBy(rows, r => r[table].id)
    for (let info of joinInfos) { // 进行group by操作，生成内部的数组对象，目前只能够支持1个数组
      if (info.multiple) {
        let existed = new Set()
        rows = rows.filter(r => existed.has(r[table].id) ? false : existed.add(r[table].id))
        rows = rows.map(r => ({ ...r, [info.dest]: grouped[r[table].id].map(t => t[info.dest]) }))
      }
    }
    rows = rows.map(r => ({ ...r[table], ...r }))
    for (let r of rows) {
      delete r[table]
    }
    return rows
  }
  count = async (table: string, options?: FindOptions): Promise<number> => {
    return await this.queryValue(`select count(*) from ${table} where ${this.toWhere(options && options.where)}`)
  }
  findAndCount = async (table: string, options?: FindOptions): Promise<any> => {
    return {
      count: await this.count(table, options),
      rows: await this.find(table, options),
    }
  }
  pagingSql = async (sql: string, pager: Pager): Promise<any> => {
    return {
      count: await this.queryValue(`select count(*) from (${sql}) a`),
      rows: await this.query(`${sql} ${pager.sql}`),
    }
  }
  findOne = async (table: string, options?: FindOptions): Promise<any> => {
    return this.find(table, options).then(rs => rs[0])
  }
  findById = async (table: string, id): Promise<any> => {
    return this.findOne(table, { where: { id } })
  }
  deleteById = async (table: string, id): Promise<any> => {
    return this.query(`delete from ${table} where id=?`, id)
  }
  deleteWhere = async (table: string, where: object): Promise<any> => {
    return await this.execute(`delete from ${table} where ${this.toWhere(where)}`)
  }
  insert = async (table: string, record, options: InsertOptions = {}) => {
    let records = _.isArray(record) ? record : [record]
    let meta = options.meta || await this.getMeta(table)
    let sql = buildInsert(table, records, meta, options)
    return await this.execute(sql)
  }
  update = async (table: string, record): Promise<any> => {
    let meta = await this.getMeta(table)
    let matchKeys = _.intersection(_.keys(record), _.keys(meta))
    let diff = notNullProvided(matchKeys, meta)
    if (diff.length === 0) { // 如果能够用insert on duplicate，则使用
      return await this.insert(table, record, { updates: [], meta })
    }
    if (!record.id) throw new Error(`update: ${table} without id and not null [${diff}] not provided, ${JSON.stringify(record)}`)
    record[updateTime] = new Date().format()
    return await this.execute(`update ${table} set ${matchKeys.map((k, i) => `${k}=${getSqlValue(meta, record, k)}`).join(',')} where id=${record.id}`)
  }
  updateReturn = async (table: string, record): Promise<any> => {
    let r = await this.update(table, record)
    let row = await this.findById(table, r.insertId || record.id)
    return _.extend(record, row)
  }
  async execute(obj, ...args): Promise<any> {
    let sql = obj.sql || obj
    console.log('querying: ', printable(sql), args.length && printable(args) || '')
    let begin = new Date().getTime()
    let rows = await this.queryInner(obj, ...args)
    let used = new Date().getTime() - begin
    if (rows instanceof Array) {
      !sql.startsWith('desc') && console.log(`used ${used} ms total rows: ${rows.length} ${rows.length > 0 ? 'rows0: ' + printable(rows[0]) : ''}`)
    } else {
      console.log(`used ${used} ms sql result is: `, JSON.stringify(rows))
    }
    return rows
  }
  async queryInner(obj, ...args): Promise<any> {
    let sql = obj.sql || obj
    if (_.isArray(args[0])) args = args[0]
    return new Promise<any[]>((resolve, reject) => {
      let toDate = (field, format?) => field && field.length > 5 && new Date(field).format() || null
      this.conn.my.query({
        sql, values: args, nestTables: obj.nestTables, typeCast: (field, next) => {
          let fn = { // 请注意，field.string() 只能够调用一次，否则会出现输入错位
            JSON: () => JSON.parse(field.string()),
            DATETIME: () => toDate(field.string()),
            DATE: () => toDate(field.string(), 'YYYY-MM-DD'),
          }[field.type] || next
          return fn()
        }
      }, function (err, rows) {
        if (err) {
          console.error('mysql error: ', printable(sql) + (args.length && printable(args) || ''), JSON.stringify(err))
          if (err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR' || err.fatal) {
            throw err
          }
          reject(printable(sql) + (args.length && printable(args) || '') + '\n' + err.message)
        } else {
          resolve(rows)
        }
      })
    })
  }
  getMeta = async (table: string): Promise<any> => {
    let fs = await this.query('desc ' + table)
    let types = _.object(fs.map(f => [f.Field, f.Type]))
    return { ...types, _origin: fs }
  }
  getJoinInfo = async (src, dest) => {
    let tables = `('${src}', '${dest}')`
    let r = await this.queryOne(`select * from information_schema.KEY_COLUMN_USAGE where TABLE_NAME in ${tables} and REFERENCED_TABLE_NAME in ${tables}`)
    return r && {
      src,
      dest,
      multiple: src !== r.TABLE_NAME, // 第一个表中记录可能有多个第二个表中的记录
      join: `${r.TABLE_NAME}.${r.COLUMN_NAME}=${r.REFERENCED_TABLE_NAME}.${r.REFERENCED_COLUMN_NAME}`,
    }
  }
}

export class TransactionMysql extends Mysql {
  constructor(conn) {
    super(conn)
  }
  async beginTransaction(): Promise<TransactionMysql> {
    return new Promise<TransactionMysql>((resolve, reject) => {
      this.conn.my.beginTransaction(err => {
        if (err) {
          console.log('begin transaction failed: ', err)
          reject(err)
        }
        resolve(this)
      })
    })
  }
  async commit() {
    return new Promise((resolve, reject) => {
      this.conn.my.commit(err => {
        if (err) {
          console.log('commit failed: ', err)
          reject(err)
        }
        console.log('commited')
        resolve(this)
      })
    })
  }
  async runInTransaction(asyncFunc, ignoreError = false) {
    await this.beginTransaction()
    try {
      await asyncFunc()
      await this.commit()
    } catch (e) {
      await this.rollback()
      if (!ignoreError) {
        throw e
      } else {
        console.error(e)
      }
    }
  }
  async rollback() {
    return new Promise((resolve, reject) => {
      this.conn.my.rollback(err => {
        if (err) {
          console.log('rollback failed: ', err)
          reject(err)
        }
        console.log('rollback ok')
        resolve(this)
      })
    })
  }
}

export async function newTransaction(dbstr) {
  let conn = MysqlConn.newAloneConn(dbstr)
  let trans = new TransactionMysql(conn)
  return await trans.beginTransaction()
}

function getSqlValue(meta, record, key) {
  let v = record[key]
  if (v === null) return 'null'
  if ((meta[key]).search('date') >= 0 && v) {
    v = new Date(v).format()
  } else if (typeof v === 'object') {
    v = JSON.stringify(v)
  }
  return require('mysql2').escape(v)
}

function addCreateUpdateTime(record) {
  record[createTime] = record[createTime] || new Date().format()
  record[updateTime] = new Date().format()
}

function notNullProvided(updates, meta) {
  let notNulls = meta._origin.filter(e => e.Null === 'NO' && e.Field !== 'id').map(e => e.Field)
  return _.difference(notNulls, updates)
}

function buildInsert(table, records, meta, options: InsertOptions) {
  let rs = []
  let matchKeys = _.intersection(_.keys(meta), _.keys(records[0]).concat([createTime, updateTime]))
  for (let record of records) {
    addCreateUpdateTime(record)
    rs.push(matchKeys.map(k => getSqlValue(meta, record, k)).join(','))
  }
  if (options.updates && !options.updates.length) { // updates === [] 则更新所有字段
    options.updates = matchKeys.filter(k => k !== createTime)
  }
  let updates: any[] = options && options.updates
  if (updates && updates.length && meta[updateTime]) {
    updates = _.union(options.updates, [updateTime])
  }
  let up = updates && ` on duplicate key update ${updates.map(u => `${u}=VALUES(${u})`).join(',')}`
  return `insert ${options.ignore ? 'ignore' : ''} into ${table} (${matchKeys.join(',')}) values ${rs.map(r => `(${r})`).join(',')} ${up ? up : ''}`
}
