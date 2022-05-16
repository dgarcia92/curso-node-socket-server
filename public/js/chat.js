const url = (window.location.hostname.includes('localhost'))
    ? 'http://localhost:8080/api/auth/'
    : 'https://rest-server-curso-node-gc.herokuapp.com/api/auth/';



//Referencias
const txtUid = document.querySelector('#txtUid');
const txtMsg = document.querySelector('#txtMsg'); 
const ulUsuarios = document.querySelector('#ulUsuarios'); 
const ulMensajes = document.querySelector('#ulMensajes'); 
const btnSalir = document.querySelector('#btnSalir'); 





let usuario = null;
let socket = null;

//Validar el JWT del localStorage
const validarJWT = async () => 
{
    const token = localStorage.getItem('token-node-curso') || '';

    if( token.length <= 10)
    {
        window.location = 'index.html';
        throw new Error('No hay token en el servidor');
    }


    const resp = await fetch ( url, {
        headers: { 'x-token': token }
    });

    const { usuario: userDB, token: tokenDB} = await resp.json();
    localStorage.setItem('token-node-curso', tokenDB);
    usuario = userDB;
    document.title = usuario.nombre;

    await conectarSocket();

}



const conectarSocket = async() => 
{
    socket = io({
        'extraHeaders': {
            'x-token' : localStorage.getItem('token-node-curso')
        }
    });

    socket.on('connect', () => {
        console.log('Sockets online');
    });

    socket.on('disconnect', () => {
        console.log('Sockets online');
    });


    socket.on('recibir-mensajes', ( payload ) =>{
        dibujarMensajes( payload );
    });

    socket.on('usuarios-activos', dibujarUsuarios);

    socket.on('mensaje-privado', ( payload ) =>{
        console.log("mensaje privado: ", payload );

        const { de, mensaje } = payload;

        ulMensajes.innerHTML = de + " - " + mensaje;
    });

}


const dibujarMensajes = ( mensajes = []) => {

    let mensajesHtml = ''; 
    mensajes.forEach( ({ nombre, uid, mensaje }) => {
        
        mensajesHtml += `
            <li>
                <p>
                    <span class = "text-primary">${ nombre }: </span>
                    <span>${ mensaje }</span>
                </p>
            </li>
        `;

        ulMensajes.innerHTML = mensajesHtml;
    });
}



const dibujarUsuarios = ( usuarios = []) =>{

    let usersHtml = ''; 
    usuarios.forEach( ({ nombre, uid }) => {
        
        usersHtml += `
            <li>
                <p>
                    <h5 class = "text-success">${ nombre }</h5>
                    <span class = "fs-6 text-muted">${ uid }</span>
                </p>
            </li>
        `;

    });

    ulUsuarios.innerHTML = usersHtml;

}



txtMsg.addEventListener( 'keyup', ( ev ) => {

    let { keyCode } = ev;
    if( keyCode !== 13 ){ return; }

    const mensaje = txtMsg.value;
    const uid = txtUid.value;

    if( mensaje.length === 0) { return; }
    
    socket.emit('enviar-mensaje', { mensaje, uid } );
    
});



const main = async () =>{
    
    //Validar JWT
    await validarJWT();

}


main();


