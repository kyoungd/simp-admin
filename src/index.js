'use strict';

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap({ strapi }) {

    /*
    verify(token)
    :8080 (vue)
    :3000 (react)
    */
    let interval;
    // allow all connection
    var io = require('socket.io')(strapi.server.httpServer, {
      cors: {
        origin: true,
        credentials: true
      },
      allowEIO3: true
    });
    // var io = require('socket.io')(strapi.server.httpServer, {
    //   cors: {
    //     origin: "*",
    //     methods: ["GET", "POST"],
    //     transports: ['websocket', 'polling'],
    //     allowedHeaders: ["my-custom-header"],
    //     credentials: true
    //   },
    //   allowEIO3: true
    // });

    const newid = (text) => {
      try {
        const jsondata = JSON.parse(text);
        return (new Date()).getTime().toString() + '-' + (jsondata.symbol || '')
      }
      catch {
        return (new Date()).getTime().toString()
      }
    }

    const formatMessage = (username, text) => {
      return {
        id: newid(text),
        sortid: (new Date()).getTime(),
        username,
        value: text,
        time: (new Date()).toLocaleString('en-US')
      };
    }

    const users = [];

    // Join user to chat
    const newUser = (id, username, room) => {
      const user = { id, username, room };

      const index = users.findIndex(user => user.id === id);
      if (index === -1) {
        users.push(user);
      }

      return user;
    }

    // Get current user
    const getActiveUser = (id) => {
      return users.find(user => user.id === id);
    }

    // User leaves chat
    const exitRoom = (id) => {
      const index = users.findIndex(user => user.id === id);

      if (index !== -1) {
        return users.splice(index, 1)[0];
      }
    }

    // Get room users
    const getIndividualRoomUsers = (room) => {
      return users.filter(user => user.room === room);
    }

    io.use(async (socket, next) => {
      try {
        //Socket Authentication
        const result = await strapi.plugins[
          'users-permissions'
        ].services.jwt.verify(socket.handshake.query.token);
        //Save the User ID to the socket connection
        socket.user = result.id;
        next();
      } catch (error) {
        console.log(error)
      }

    }).on('connection', function (socket) {
      if (interval) {
        clearInterval(interval);
      }
      console.log('a user connected');
      interval = setInterval(() => {
        io.emit('serverTime', { time: new Date().getTime() }); // This will emit the event to all connected sockets

      }, 1000);

      socket.on('joinRoom', ({ username, room }) => {
        try {
          const user = newUser(socket.id, username, room);
          console.log('joinRoom -- ', user);
          socket.join(user.room);
          console.log('joinRoom --- ', user.room);
          // // General welcome
          // socket.emit('message', formatMessage(user.room, 'Messages are limited to this room! '));

          // // Broadcast everytime users connects
          // socket.broadcast
          //   .to(user.room)
          //   .emit(
          //     'message',
          //     formatMessage(user.room, `${user.username} has joined the room`)
          //   );

          // // Current active users and room name
          // io.to(user.room).emit('roomUsers', {
          //   room: user.room,
          //   users: getIndividualRoomUsers(user.room)
          // });
        }
        catch (error) {
          console.log(error)
        }
        console.log('joinRoom', username, room);
      });

      // Listen for client message
      socket.on('chatMessage', msg => {
        try {
          console.log('chatMessage - ', msg);
          const user = getActiveUser(socket.id);
          io.to(user.room).emit('message', formatMessage(user.username, msg));
        }
        catch (error) {
          console.log(error)
        }
      });

      socket.on('disconnect', () => {
        const user = exitRoom(socket.id);
        try{
          // if (user) {
          //   io.to(user.room).emit(
          //     'message',
          //     formatMessage("WebCage", `${user.username} has left the room`)
          //   );

          //   // Current active users and room name
          //   io.to(user.room).emit('roomUsers', {
          //     room: user.room,
          //     users: getIndividualRoomUsers(user.room)
          //   });
          // }

          console.log('user disconnected');
          clearInterval(interval);
        }
        catch (error) {
          console.log(error)
        }
      });

      // socket.on('loadBids', async (data) => {
      //   let params = data;
      //   try {
      //     let data = await strapi.service('api::product.product').loadBids(params.id);
      //     io.emit("loadBids", data);
      //   } catch (error) {
      //     console.log(error);
      //   }
      // });

      // socket.on('makeBid', async (data) => {
      //   let params = data;
      //   try {
      //     let found = await strapi.entityService.findOne('api::product.product', params.product, { fields: "bid_price" });
      //     const account = await strapi.service('api::account.account').getUserAccount(socket.user);
      //     //Check whether user has enough more to make the bid
      //     if (parseInt(account.balance) >= parseInt(found.bid_price)) {
      //       await strapi.service('api::bid.bid').makeBid({ ...params, account: account.id });
      //       let product = await strapi.service('api::product.product').findAndUpdateBidPrice(found, params.bidValue);
      //       let updatedProduct = await strapi.service('api::product.product').loadBids(product.id);
      //       io.emit("loadBids", updatedProduct);
      //     } else {
      //       console.log("Balance Is low")
      //     }
      //   } catch (error) {
      //     console.log(error);
      //   }
      // });

    });

    strapi.io = io

  },

};


