var express = require('express');
var router = express.Router();
const md5 = require('blueimp-md5')
const filter = {password: 0, __v: 0} //查询时过滤指定的属性

const {UserModel, ChatModel} = require('../db/models')
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
// 1) 需求:
// a. 后台应用运行端口指定为 4000
// b. 提供一个用户注册的接口
// a) path 为: /register
// b) 请求方式为: POST
// c) 接收 username 和 password 参数
// d) admin 是已注册用户
// e) 注册成功返回: {code: 0, data: {_id: 'abc', username: ‘xxx’, password:’123’}
// f) 注册失败返回: {code: 1, msg: '此用户已存在'}
// router.post('/register', function(req, res) {
//   const {username, password} = req.body
//   console.log(req.body)
//   if(username === 'admin') {
//     // 返回失败的相应数据
//     res.send({code: 1, msg: '此用户已经存在'})
//   } else {
//     res.send({code: 0, data: {id: 1, username, password}})
//   }
// })

// 注册
router.post('/register', function(req, res){
  // 获取请求参数数据
  const {username, password, type} = req.body
  // 处理逻辑
  // 判断用户是否已经存在,如果存在,返回错误的提示,如果不存在,就保存数据
  UserModel.findOne({username}, function(err, user){
    if(user) {
      res.send({code: 1, msg: '此用户已经存在'})
    }else {
      new UserModel({username, password: md5(password), type}).save(function(err, user){
        console.log(err, user)
        // 生成一个cookie
        res.cookie('userid', user._id, {maxAge: 1000*60*60*24})
        const data = {username, type, _id: user._id}
        res.send({code: 0, data})
      })
    }
  })

})

// 登录的路由
router.post('/login', function(req, res){
  const {username, password} = req.body
  UserModel.findOne({username, password: md5(password)}, filter, function(err, user){ //使用过滤属性
    if(user){
      console.log(user)
      res.cookie('userid', user._id, {maxAge: 1000*60*60*24})
      res.send({code: 0, data: user})
    }else{
      res.send({code: 1, msg: '用户名或者密码不存在'})
    }
  })
})

//跟新用户信息
router.post('/update', function(req, res){
  // 需要根据cookie获取用户id
  const userid = req.cookies.userid
  // 如果不存在，直接返回提示信息的结果
  if(!userid) {
    res.send({code: 1, msg: '请先登录'})
  } else {
    const user = req.body 
    UserModel.findByIdAndUpdate({_id: userid}, user,function(err, oldUser){
      if(!oldUser){
        //通知浏览器删除userid cookie
        res.clearCookie(userid)
        res.send({code: 1, msg: '请先登录'})
      }else {
        const {_id, username, type} = oldUser
        const data = Object.assign(user, {_id, username, type})
        res.send({code: 0, data})
      }
    })
  }
  
})

// 获取当前的用户
router.get('/user', function(req, res){
  const userid = req.cookies.userid
  if(!userid){
    return res.send({code: 1, msg: '请先登录'})
  }
  UserModel.findOne({_id: userid}, filter, function(err, user){
    res.send({code: 0, data: user})
  })
})

//根据type获取用户列表
router.get('/userlist', function(req, res){
  const {type} = req.query
  UserModel.find({type}, filter, function(err, users){
    res.send({code: 0, data: users})
  })
})

/*获取当前用户所有相关聊天信息列表
*/
router.get('/msglist', function (req, res) {
    // 获取 cookie 中的 userid
    const userid = req.cookies.userid
    // 查询得到所有 user 文档数组
    UserModel.find(function (err, userDocs) {
        // 用对象存储所有 user 信息: key 为 user 的_id, val 为 name 和 header 组成的 user 对象
        const users = {} // 对象容器
        userDocs.forEach(doc => {
          users[doc._id] = {username: doc.username, avatar: doc.avatar}
    })
    /*查询 userid 相关的所有聊天信息
    参数 1: 查询条件
    参数 2: 过滤条件
    参数 3: 回调函数
    */
    ChatModel.find( function (err,chatMsgs) {
            // 返回包含所有用户和当前用户相关的所有聊天消息的数据
            res.send({code: 0, data: {users, chatMsgs}})
        })
    })
})
/*修改指定消息为已读
*/
router.post('/readmsg', function (req, res) {
    // 得到请求中的 from 和 to
    const from = req.body.from
    const to = req.cookies.userid
    /*更新数据库中的 chat 数据
    参数 1: 查询条件
    参数 2: 更新为指定的数据对象
    参数 3: 是否 1 次更新多条, 默认只更新一条
    参数 4: 更新完成的回调函数
    */
    ChatModel.update({from, to, read: false}, {read: true}, {multi: true}, function (err,
    doc) {
        console.log('/readmsg', doc)
        res.send({code: 0, data: doc.nModified}) // 更新的数量
    })
})
module.exports = router;
