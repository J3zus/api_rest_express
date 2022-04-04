const express = require('express'); //Importar express
const Joi = require('joi'); //Importa Joi
const app = express(); //Crea una instancioa de express
const logger = require('./logger');
const morgan = require('morgan');
const config = require('config');
const inicioDebug = require('debug')('app:inicio');
const dbDebug = require('debug')('app:db')


//Middleware
//El middleware es un bloque de codigo que  se ejecuta
//entre las peticiones del usuario (cliente) y el   
//request que llega al servidor. Es un enlace entre la peticion
//del usuario y el servidor, antes de que este pueda dar una respuesta.

//Las funciones de middleware son funciones que tienen acceso
//al objeto de peticion (request req), al objeto de respuesta (response, res)
//y a la siguiente funcion del middleware en el ciclo de peticiones/respuestas
//de la aplicacion. La siguiente funcion de middleware se denota
//normalmente con una variable denominada next.

//Las funciones de middleware pueden realizar las siguientes tareas:
//      - Ejecutar cualquier codigo.
//      - Realizar cambios en la peticion y los objetos de respuesta.
//      - Finalizar el ciclo de peticion/respuesta.
//      - Invocar la siguiente funcion de middleware en la pila.

//Express es un framework de direccionamiento y de uso de middleware
// que permite que la aplicacion tenga funcionalidad minima propia.

// Ya usamos algunos middleware como express.json()
// transforma el body del req a formato JSON

//          -------------------------
// request -|-> json() --> route() -|-> response
//          ------------------------

//route() --> Funciones GET, POST, PUT, DELETE

//JSON hace un parsing de la entrada a formato JSON
//De tal forma que lo que recibamos 
app.use(express.json()); //Se le dice a express que use este middleware
app.use(express.urlencoded({extended: true})); //Middleware que cambia o transforma nuestras entradas.


//Public es el nombre de la carpeta que tendra los recursos estaticos.
app.use(express.static('public')); //Este middleware, Define la ruta para acceder a los recursos estaticos y poder desplegarlos dentro de la aplicacion. 

console.log(`Aplicacion: ${config.get('nombre')}`);
console.log(`DB Server: ${config.get('configDB.host')}`);

//Uso de middleware de tercero - morgan
if(app.get('env') == 'development'){ //Env es una propiedad del objeto config que nos va a decir en que entorno estamos trabajando (variable de entorno)
    app.use(morgan('tiny'));
    //console.log('Morgan est habilitado ...');
    inicioDebug('Morgan esta habilitado...')
}

//Operaciones con la base de datos
dbDebug('Conectando a la base de datos')
/*
//Estos middleware se llaman antes de las peticiones.
app.use(logger); //logger ya hace referencia a la funcion log(exports)


app.use(function(req, res, next){
    console.log('Autentificando... ');
    next();
});
*/


//Query string
//url/?var1=valor1&va2=valor2&vae3=valor3...

/*
Hay cutro tipo de peticiones
Asociados con las operaciones CRUD de una base de datos
app.get(); //Consulta de datos
app.post(); //Envia datos al servidor (inserta datos)
app.put(); //Aactualiza datos
app.delete(); //Elimina datos
*/

const usuarios = [
    {id:1,nombre:'Juan'},
    {id:2,nombre:'Ana'},
    {id:3,nombre:'Karen'},
    {id:4,nombre:'Luis'},
]

//Consulra en la ruta raiz de nuestro servidor
//con una funcion callback
app.get('/',(req, res)=>{
    res.send('Hola mundo desde Express!');
});

app.get('/api/usuarios', (req, res) =>{
    res.send(usuarios);
});

//Como pasar parametros dentro de las rutas
//p. ej. solo quiero un usuario especifico en vex de todos 
// Con los: delante del id Express
//sabe que es un parametro a recibir
//http://localhost:3000/api/usuarios/1990/2/sex='m'&name=''
app.get('/api/usuarios/:id', (req, res)=>{
    //Devuelve el primer elemento del arreglo que cumpla con un predicado
    //parseInt hace el casteo a entero directamente
    let usuario = existeUsuario(req.params.id);

    if(!usuario)
        res.status(404).send('El usuario no se encuentra'); //Devuelve el estado HTTP

    res.send(usuario);
});

//Tiene el mismo nombre que la petiicion GET
//Express hace la diferencia dependiendo del
//tipo de peticion
app.post('/api/usuarios',(req, res)=>{
    //El objeto req tiene la propiedad body

    const {value, error} = validarUsuario(req.body.nombre);
    if(!error){
        const usuario = {
            id:usuarios.length + 1,
            nombre:req.body.nombre
        };
        usuarios.push(usuario);
        res.send(usuario);
    }else{
        const mensaje = error.details[0].message;
        res.status(400).send(mensaje);
    }

});

//Peticion PUT
//Metodo para actualizar informacion
//Recibe el id del usuario que se quiere modificar
//Utilizando un parametro en la ruta :id
app.put('/api/usuarios/:id', (req, res) => {
    let usuario = existeUsuario(req.params.id);
    if(!usuario){
        res.status(404).send('El usuario no se encuentra'); //Devuelve el estado HTTP
    //En el body del request debe venir la informacion
    //para hacer la actualizacion.
        return;
    }
    //Validar que el nombre cumpla con las condiciones.
    
    //El objeto req tiene la propiedad body
    const {value, error} = validarUsuario(req.body.nombre);
    if(error){
        const mensaje = error.details[0].message;
        res.status(400).send(mensaje);
        return;
    }

    //Actualiza el nombre del usuario
    usuario.nombre = value.nombre;
    res.send(usuario);

});

//Peticion DELETE
//Metodo para eliminar informacion
//Recibe el id del usuario que se quiere eliminar
//Utilizando un parametro en la ruta :id

app.delete('/api/usuarios/:id', (req, res) => {
    const usuario = existeUsuario(req.params.id);
    if(!usuario){
        res.status(404).send('El usuario no se encuentra');
        return;
    }

    //Encontrar el indice del usuario dentro del arreglo
    const index = usuarios.indexOf(usuario);
    usuarios.splice(index, 1); //Elimina el elemento del indice indicado
    res.send(usuario);
});

//Usando el modulo process, se lee una variable de entorno.
// Si la variable no existe, va a tomar un valor por default(3000)

const port = process.env.PORT || 3000;
//console.log(process.env);


app.listen(port, () =>{
    console.log(`Escuchando en el puerto ${port}...`);
});

function existeUsuario(id){
    return (usuarios.find(u => u.id === parseInt(id)));
}

function validarUsuario(nom){
    const schema = Joi.object({
        nombre:Joi.string().min(3).required()
    });
    return (schema.validate({nombre:nom}));
}