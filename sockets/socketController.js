const { Socket } = require("socket.io");
const { comprobarJWT } = require("../helpers");
const { ChatMensajes } = require("../models") 

const chatMensajes = new ChatMensajes();

const socketController = async ( socket =  new Socket(), io) =>   // El = new Socket nos sirve para el tipado, debemos de quitarlo en producción
{

    const token = socket.handshake.headers['x-token'];
    const usuario = await comprobarJWT( token );

    if( !usuario )
    {
        return socket.disconnect();
    }

    //Agregar el usuario conectado
    chatMensajes.agregarUsuario( usuario ); 
    io.emit('usuarios-activos', chatMensajes.usuariosArr);
    socket.emit('recibir-mensajes', chatMensajes.ultimos10); //solo le pasamos a la persona que se conecta

    //Conectarlo a una sala especial
    socket.join( usuario.id );  //global, socket.id, usuario.id



    //Limpiar cuando alguien se desconecta
    socket.on('disconnect', () =>{
        chatMensajes.desconectarUsuario( usuario.id );
        io.emit('usuarios-activos', chatMensajes.usuariosArr);
    });

    socket.on('enviar-mensaje', ( payload ) => {
        const { uid, mensaje } = payload;

        if( uid ) //Mensaje Privado
        {
            chatMensajes.enviarMensaje( usuario.id, usuario.nombre, mensaje);
            socket.to( uid ).emit('mensaje-privado', { de: usuario.nombre, mensaje });
        }
        else
        {
            chatMensajes.enviarMensaje( usuario.id, usuario.nombre, mensaje);
            io.emit('recibir-mensajes', chatMensajes.ultimos10);
        }
      
    });


}   

module.exports = 
{
    socketController
}