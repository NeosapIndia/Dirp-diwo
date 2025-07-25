//socket-singletion.js
/* create a accessible Socket Object */

const socket = require('socket.io');

module.exports = (function () {
    try {
        this.io = null;
        // {name: 'roomname', status: 'active', connectedUsers: 2, share_url: } 
        this.roomsList = {};
        this.initialize = function (server) {
            this.io = socket(server);
            this.io.of('/v1/demo').on('connection', (socket) => {
                socket.on('join-room', (data) => {
                    data = JSON.parse(data);
                    console.log('Trying to join - ', data);
                    let room = data.room;
                    let userType = data.type;
                    // console.log('Joining room ', data, room, userType);
                    let roomId = this.roomsList[room];
                    // console.log('room', roomId);
                    if (roomId) {
                        if(roomId.status == 'cancelled'){
                            console.log('Room closed');
                            socket.to(socket.id).emit('new-event', { message: 'Room is no longer Open.'});
                            return;
                        }
                        socket.join(room);
                        roomId.connectedUsers = roomId.connectedUsers + 1;
                        if (roomId.connectedUsers > 0) {
                            roomId.status = 'active';
                            roomId.users.push({user: socket.id, type: userType});
                        }
                        if( roomId.connectedUsers > 1) {
                            if(JSON.stringify(roomId.users).includes('Presenter') && JSON.stringify(roomId.users).includes('Viewer')){
                                roomId.status = 'presenting';
                                socket.to(room).emit('start-demo', { message : 'All Users joined'});
                            }
                        }
                        // console.log('After joining', roomId);
                    } else {
                        console.log('Not Valid', this.roomsList);
                        socket.to(socket.id).emit('new-event', { message: 'Room is no longer Open.'});
                        return;
                    }
                });

                socket.on('event', (data) => {
                    // socket.to(data.room).emit('new-event', data);
                });

                socket.on('new-slide', (data) => {
                    console.log('Requested to show', data.message);
                    /* Broadcast message to every connected User Point */
                    socket.to(data.room).emit('update-slide', JSON.stringify({slide: data.message, seq: data.sequence}));
                });

                socket.on('video-event', (data) => {
                    socket.to(data.room).emit('video-e', data.message);
                });

                // socket.on('disconnect', (data) => {
                //     console.log('Socket disconnect', data);
                // })

            });
        }
        return this;
    } catch (error) {
        console.log('Caught Error in Socket ', error);
    }
})();