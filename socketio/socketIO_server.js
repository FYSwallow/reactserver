const {ChatModel} = require('../db/models')

module.exports = function (server) {
    const io = require('socket.io')(server)
    io.on('connection', function(socket){
        socket.on('sendMsg', function({from, to, content}){
            
            const chat_id = [from, to].sort().join('_')
            const create_time = Date.now()
            console.log({from, to, content})
            new ChatModel({from, to, content, chat_id, create_time}).save(function(err, chatMsg){
                io.emit('receiveMsg', chatMsg)
                //io是发送给所有连接的对象
            })
            ChatModel.find(function(err, docs){
                io.emit('chat', docs)
            })
        })
    })
}