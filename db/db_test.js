// 测试mongoose操作mongodb数据库
const md5 = require('blueimp-md5')
const mongoose = require('mongoose')
mongoose.connect('mongodb://localhost:27017/gzhipin_test2')
const conn = mongoose.connection
conn.on('connected', function(){
    console.log('数据库连接成功')
})

// 得到对应特定集合的Model
// 定义文档结构
const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    header: {
        type: String
    }
})

// 定义集合Model
const UserModel = mongoose.model('user', userSchema) //集合名users
// 创建Model实例的save()添加数据 Model相当于一个数组，Schema相当于一个数组中的数据
function testSave() {
    const userModel = new UserModel({username: 'Bob', password: md5('234'), type: 'laoban'})
    userModel.save(function(err, user) {
        console.log('save()', err, user)
    })
}
// testSave()

// 查询Model的文档
function testFind() {
    UserModel.find(function(err, users){
        console.log('find',err, users)
    })
    // 查询一个
    UserModel.findOne({id: '289dff07669d7a23de0ef88d2f7129e7'}, function(err, user) {
        const data = {}
        console.log('findOne', err, user)
    })
}
testFind()

// 更新数据
function testUpdate() {
    console.log(1)
    UserModel.findByIdAndUpdate({id: '289dff07669d7a23de0ef88d2f7129e7'}, 
        {username: 'Jack'}, function(err, oldUser){ //返回旧的文档
        console.log('findByIdAndUpdate',err, oldUser)
    })
}
// testUpdate()

// 删除匹配的数据
function testDelete() {
    UserModel.remove({id: '289dff07669d7a23de0ef88d2f7129e7'}, function(err, doc){
        console.log('testDelete',err,doc)
    })
}
testDelete()